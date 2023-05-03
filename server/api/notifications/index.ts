import prisma from "~/helpers/script";
import {CannedResponseMessages, Payload, HttpResponseTemplate, HttpResponseType} from "~/types";

export default defineEventHandler(async (event) => {
    const user_id = await readBody(event);

    if (!user_id) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NO_USER_PROVIDED
        } as HttpResponseTemplate
    }

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: await prisma.notification.findMany({
                where: {
                    for_user_id: user_id.toString(),
                    opened: false
                }
            })
        } as Payload
    } as HttpResponseTemplate
})