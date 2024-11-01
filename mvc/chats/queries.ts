import prisma from "~/db";
import {getAdmins, getUserOrEphemeralUser_Secure} from "~/mvc/user/queries";
import {obtainChat_id, writeFileToStorage} from "~/mvc/chats/helpers";
import path from "path";

export async function getUserChats(user_id: string) {
    user_id = user_id.toString()
    const user = await getUserOrEphemeralUser_Secure(user_id).catch(e => e as Error)
    if (!user || user instanceof Error) return []

    const chatsFromMessages = await prisma.message.findMany({
        where: {
            OR: [
                {from_user_id: user_id},
                {to_user_id: user_id}
            ]
        },
        select: {
            Chat: true
        },
        distinct: ['chatId']
    })

    const chatIds = chatsFromMessages.map(chat => chat.Chat.id)

    let chatsWithMessages = await prisma.chat.findMany({
        where: {
            id: {
                in: chatIds
            }
        },
        include: {
            Message: {
                include: {
                    Attachment: true
                }
            }
        }
    });

    let mapped_chats = await Promise.all(
        chatsWithMessages.map(async (chat) => {
            // to_user_id is the other one that is not the user's id
            let to_user_id = chat.Message[0].from_user_id === user_id.toString() ? chat.Message[0].to_user_id : chat.Message[0].from_user_id?.toString()
            const to_user = await getUserOrEphemeralUser_Secure(to_user_id || undefined)

            return {
                ...chat,
                user_id: user_id.toString(),
                WithUser: to_user
            }
        })
    )
    
    let admins = await getAdmins({companyId: user!.companyId!})
    let chat_length = mapped_chats.length

    // if an admin is not in the chats, create a chat with them
    for (let admin of admins) {
        let chats_has_admin = chatsWithMessages.find(chat => chat.Message[0].from_user_id?.toString() === admin.user_id.toString() || chat.Message[0].to_user_id?.toString() === admin.user_id.toString())

        if (!chats_has_admin && admin.user_id.toString() !== user_id.toString()) {
            mapped_chats.push({
                id: ++chat_length,
                Message: [],
                chat_id: obtainChat_id(user_id.toString(), admin.user_id.toString()).toString(),
                created_at: new Date(),
                ticketId: null,
                user_id: user_id.toString(),
                companyId: user.companyId!,
                WithUser: admin
            })
        }
    }

    return mapped_chats
}

export async function getOrCreateChat(from_user_id: string, to_user_id: string, company: {id: number} | {name: string}) {
    return await prisma.chat.upsert({
        create: {
            chat_id: obtainChat_id(from_user_id, to_user_id).toString(),
            Company: {
                connect: company
            }
        },
        update: {},
        where: {
            chat_id: obtainChat_id(from_user_id, to_user_id).toString()
        },
        include: {
            Message: true
        }
    }).catch(
        (error) => {
            console.log(error)
            return null
        }
    )
}

export async function createMessage(chat_id: string, from_user_id: string, to_user_id: string, message: string) {
    return await prisma.message.create(
        {
            data: {
                Chat: {
                    connect: {
                        chat_id: chat_id
                    }
                },
                from_user_id: from_user_id.toString(),
                to_user_id: to_user_id.toString(),
                message: message || ''
            }
        }
    ).catch(
        (error) => {
            console.log(error)
            return null
        }
    )
}


export async function readUserMessage(user_id: string, chat_id: string) {
    await prisma.message.updateMany({
        where: {
            to_user_id: user_id.toString(),
            Chat: {
                chat_id: chat_id
            },
            opened: false
        },
        data: {
            opened: true
        }
    })
}

export async function storeFiles(files: any[], messageId: number, chat_id: string, user_id: string) {
    let filePath = [user_id, chat_id].join(path.sep)

    for (const file of files) {
        try{
            await writeFileToStorage(filePath, file, messageId)
        } catch (e) {
            throw e
        }
    }
}

export async function storeLocation(location: string, messageId: number, fileSize: number) {
    await prisma.attachment.create({
        data: {
            Message: {
                connect: {
                    id: messageId
                }
            },
            url: location,
            name: location.split('/').pop() || 'unknown',
            size: fileSize
        }
    }).catch(
        (error) => {
            console.log(error)
            return null
        })
}

export async function fileExists(url: string) {
    const attachment = await prisma.attachment.findFirst({
        where: {
            url: url
        }
    })

    return !!attachment
}


export async function getMessageById(messageId: number) {
    return prisma.message.findUnique({
        where: {
            id: messageId
        },
        include: {
            Attachment: true
        }
    })
}


export async function deleteMessage(messageId: number) {
    const message = await getMessageById(messageId)
    if (!message) return true

    for (let attachment of message.Attachment) {
        await prisma.attachment.delete({
            where: {
                id: attachment.id
            }
        })
    }

    await prisma.message.delete({
        where: {
            id: messageId
        }
    })

    return true
}

export async function getOldestUnpurgedAttachments(limit: number | null) {
    return prisma.attachment.findMany({
        where: {
            to_purge: false
        },
        orderBy: {
            created_at: 'asc'
        },
        take: limit || 100
    });
}


export async function getTotalAttachmentsSize(callback: Function | null = null){
    const total = await prisma.attachment.aggregate({
        _sum: {
            size: true
        }
    })

    if (callback) return callback(total._sum.size)
    return total._sum.size
}

export async function deleteAttachment(attachmentId: number) {
    await prisma.attachment.delete({
        where: {
            id: attachmentId
        }
    })
}

export async function addToPurge(attachmentId: number) {
    const max_days = process.env.DELETE_WARNING || "2"
    const deadline_date = new Date(Date.now() + parseInt(max_days) * 24 * 60 * 60 * 1000)
    
    await prisma.filePurge.create({
        data: {
            attachmentId: attachmentId,
            deadline: deadline_date
        }
    }).catch(console.error)

    await prisma.attachment.update({
        where: {
            id: attachmentId
        },
        data: {
            to_purge: true
        }
    })
}

export async function getPurgeList() {
    return prisma.filePurge.findMany({
        where: {
            deadline: {
                lte: new Date()
            }
        },
        include: {
            Attachment: true
        }
    })
}

export async function deletePurgeItem(attachmentId: number) {
    await prisma.filePurge.deleteMany({
        where: {
            attachmentId: attachmentId
        }
    })
}