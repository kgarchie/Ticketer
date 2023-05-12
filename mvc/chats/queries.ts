import prisma from "~/db";
import {getAdmins, getUserOrEphemeralUser_Secure} from "~/mvc/user/queries";
import {obtainChat_id} from "~/mvc/chats/helpers";

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
            Message: true
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

    // if an admin is not in the chats, create a chat with them, and send an initial message, and then add it to the chats
    for (let admin of admins) {
        let chats_has_admin = chatsWithMessages.find(chat => chat.Message[0].from_user_id?.toString() === admin.user_id.toString() || chat.Message[0].to_user_id?.toString() === admin.user_id.toString())

        if (!chats_has_admin && admin.user_id.toString() !== user_id.toString()) {
            const new_chat = await createChat(admin.user_id, user_id.toString())

            // @ts-ignore
            mapped_chats.push({
                ...new_chat,
                user_id: user_id.toString(),
                WithUser: admin
            })
        }
    }

    return mapped_chats
}

export async function createChat(from_user_id: string, to_user_id: string) {
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
    return prisma.message.create(
        {
            data: {
                chat: {
                    connect: {
                        chat_id: chat_id
                    }
                },
                from_user_id: from_user_id.toString(),
                to_user_id: to_user_id.toString(),
                message: message
            }
        }
    ).catch(
        (error) => {
            console.log(error)
            return null
        }
    )
}


export async function readUserMessage(user_id:string, chat_id:string){
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

