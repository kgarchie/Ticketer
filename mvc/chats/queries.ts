import prisma from "~/db";
import {v4} from "uuid";
import {getAdmins, getUserOrEphemeralUser_Secure} from "~/mvc/user/queries";
import {getAuthCookie} from "~/mvc/auth/helpers";

export async function getUserChats(user_id: string, is_admin=false) {
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
            let to_user_id = chat.Message[0].from_user_id === user_id.toString() ? chat.Message[0].to_user_id : chat.Message[0].from_user_id;
            const to_user = await getUserOrEphemeralUser_Secure(to_user_id || undefined)

            return {
                ...chat,
                user_id: user_id,
                WithUser: to_user
            }
        })
    )

    let admins = await getAdmins()

    // if an admin is not in the chats, create a chat with them, and send an initial message, and then add it to the chats
    for (let admin of admins) {
        let chats_has_admin = chatsWithMessages.find(chat => chat.Message[0].from_user_id === admin.user_id.toString() || chat.Message[0].to_user_id === admin.user_id.toString())

        if (!chats_has_admin && admin.user_id !== user_id) {
            const new_chat = await createChat(user_id, admin.user_id)

            if (!new_chat) break
            let initial_message = 'Hello, I am ' + admin.name + ' from ' + admin.company?.name + '. How can I help you?'

            if (is_admin) {
                initial_message = 'Hello, fellow admin! I am ' + admin.name + ' from ' + admin.company?.name
            }

            const message = await createMessage(new_chat?.chat_id, admin.user_id, user_id, initial_message)
            if (!message) break

            const chat_with_message = await prisma.chat.findUnique({
                where: {
                    id: new_chat?.id
                },
                include: {
                    Message: true
                }
            })

            // @ts-ignore
            mapped_chats.push({
                ...chat_with_message,
                user_id: user_id,
                WithUser: admin
            })
        }
    }

    return mapped_chats
}

export async function createChat(from_user_id: string, to_user_id: string) {
    let chat = await prisma.chat.findFirst({
            where: {
                AND: [
                    {
                        Message: {
                            some: {
                                from_user_id: from_user_id.toString(),
                                to_user_id: to_user_id.toString()
                            }
                        }
                    },
                    {
                        Message: {
                            some: {
                                from_user_id: to_user_id.toString(),
                                to_user_id: from_user_id.toString()
                            }
                        }
                    }
                ]
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
                chat_id: v4()
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
            to_user_id: user_id,
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

