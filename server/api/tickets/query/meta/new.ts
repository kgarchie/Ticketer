import prisma from "~/helpers/script"
import {HttpResponseTemplate, HttpResponseType, Payload, STATUS} from "~/types"

export default defineEventHandler(async () => {
    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: await prisma.ticket.findMany(
                {
                    where: {
                        status: STATUS.O
                    }
                }
            )
        } as Payload
    } as HttpResponseTemplate
})