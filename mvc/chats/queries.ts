import prisma from "~/db";
import {getAdmins, getUserOrEphemeralUser_Secure} from "~/mvc/user/queries";
import {writeFileToStorage, obtainChat_id} from "~/mvc/chats/helpers";
import path from "path";

export async function getUserChats(user_id: string) {
    const chatsFromMessages = await prisma.message.findMany({
        where: {
            OR: [
                {from_user_id: user_id.toString()},
                {to_user_id: user_id.toString()}
            ]
        },
        select: {
            chat: true
        },
        distinct: ['chatId']
    })

    const chatIds = chatsFromMessages.map(chat => chat.chat.id)

    let chatsWithMessages = await prisma.chat.findMany({
        where: {
            id: {
                in: chatIds
            }
        },
        include: {
            Message: {
                include: {
                    attachments: true
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

    let admins = await getAdmins()
    let chat_length = mapped_chats.length

    // if an admin is not in the chats, create a chat with them, and send an initial message, and then add it to the chats
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
                WithUser: admin
            })
        }
    }

    return mapped_chats
}

export async function getOrCreateChat(from_user_id: string, to_user_id: string) {
    let chat = await prisma.chat.findFirst({
        where: {
            chat_id: obtainChat_id(from_user_id, to_user_id).toString()
        },
        include: {
            Message: true
        }
    }).then(
        (data) => {
            if (data) {
                return data
            } else {
                return null
            }
        }
    ).catch((err) => {
        console.log(err)
        return null;
    })  // if no chat exists, create one

    if (chat) return chat

    chat = await prisma.chat.create({
        data: {
            chat_id: obtainChat_id(from_user_id, to_user_id).toString(),
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

    return chat
}

export async function createMessage(chat_id: string, from_user_id: string, to_user_id: string, message: string) {
    return await prisma.message.create(
        {
            data: {
                chat: {
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
            chat: {
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
    let filePath = path.join(user_id, chat_id)
    let locationsOnDisk: string[] = []

    for (const file of files) {
        await writeFileToStorage(filePath, locationsOnDisk, file)
    }

    for(let location of locationsOnDisk) {
        await prisma.attachment.create({
            data: {
                Message: {
                    connect: {
                        id: messageId
                    }
                },
                url: location,
                name: location.split('/').pop() || 'unknown'
            }
        })
    }
}


export async function getMessageById(messageId: number) {
    return prisma.message.findFirst({
        where: {
            id: messageId
        },
        include: {
            attachments: true
        }
    })
}


export async function deleteMessage(messageId: number) {
    const message = await getMessageById(messageId)
    if (!message) return true

    for (let attachment of message.attachments) {
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