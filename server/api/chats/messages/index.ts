import prisma from "~/helpers/script";
import {CannedResponseMessages, Payload, HttpResponseTemplate, HttpResponseType} from "~/types";

export default defineEventHandler(async (event) => {
    const {user_id, chat_id} = await readBody(event);

    if (!user_id || !chat_id) {
        return {
            status: 400,
            body: CannedResponseMessages.NO_USER_PROVIDED
        };
    }

    const messages = await prisma.message.findMany({
        where: {
            chat: {
                chat_id: chat_id
            }
        }
    }).then(messages => {
        return messages
    }).catch(err => {
        console.log(err);
        return null
    })

    const payload = {
        data: messages
    } as Payload

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: payload
    } as HttpResponseTemplate
})