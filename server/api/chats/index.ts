import prisma from "~/helpers/script";
import {CannedResponseMessages, Payload, HttpResponseTemplate, HttpResponseType} from "~/types";

export default defineEventHandler(async (event) => {
    const user_id = await readBody(event);
    let chatIds: any[] = [];

    if (!user_id) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NO_USER_PROVIDED
        } as HttpResponseTemplate
    }

    chatIds = await prisma.message.findMany({
        where: {
            OR: [
                { from_user_id: user_id.toString() },
                { to_user_id: user_id.toString() }
            ]
        },
        select: {
            chatId: true
        },
        distinct: ['chatId']
    })

    chatIds = chatIds.map(chat => chat.chatId)

    let chats = await prisma.chat.findMany({
        where: {
            id: {
                in: chatIds
            }
        },
        include: {
            Message: {
                where: {
                    OR: [
                        { from_user_id: user_id.toString() },
                        { to_user_id: user_id.toString() }
                    ]
                }
            }
        }
    });

    let mapped_chats = await Promise.all(
        chats.map(async (chat) => {
            // to_user_id is the other one that is not the user's id
            let to_user_id = chat.Message[0].from_user_id === user_id.toString() ? chat.Message[0].to_user_id : chat.Message[0].from_user_id;
            let to_user: any;

            to_user = await prisma.user.findUnique({
                where: {
                    user_id: to_user_id || undefined
                },
                select: {
                    name: true,
                    email: true,
                    company: true,
                    is_admin: true,
                    user_id: true
                }
            })

            if (!to_user) {
                to_user = await prisma.ephemeralUser.findUnique({
                    where: {
                        user_id: to_user_id || undefined
                    }
                })
            }

            return {
                ...chat,
                to_user: to_user
            }
        })
    )

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: mapped_chats
        } as Payload
    } as HttpResponseTemplate;
});
