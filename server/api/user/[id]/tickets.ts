import prisma from "~/helpers/script"
import {HttpResponseTemplate, HttpResponseType, Payload} from "~/types";

export default defineEventHandler(async (event) => {
    const user_id = event.context.params?.id as string | null;

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: await prisma.ticket.findMany({
                where: {
                    user_id: user_id?.toString()
                }
            })
        } as Payload
    } as HttpResponseTemplate
})