import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType} from "~/types";
import prisma from "~/helpers/script";

export default defineEventHandler(async (event) => {
    const {chat_id, user_id} = await readBody(event);

    if (!chat_id) {
        return {
            statusCode: 400,
            body: CannedResponseMessages.NO_CHAT_PROVIDED
        };
    }

    let messages = await prisma.message.updateMany(
        {
            where: {
                chat: {
                    chat_id: chat_id
                },
                to_user_id: user_id,
                opened: false
            },
            data: {
                opened: true
            }
        },
    ).catch(err => {
        console.log(err);
        return null
    })


    if (messages) {
        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: CannedResponseMessages.REQUEST_SUCCESS
        } as HttpResponseTemplate
    }

    return {
        statusCode: 400,
        type: HttpResponseType.ERROR,
        body: CannedResponseMessages.REQUEST_FAILED
    } as HttpResponseTemplate
})