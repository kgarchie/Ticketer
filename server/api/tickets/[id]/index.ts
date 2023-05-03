import prisma from "~/helpers/script"
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType, Payload} from "~/types";

export default defineEventHandler(async (event) => {
    const ticket_id = event.context.params?.id as string | null;

    if(!ticket_id){
        return {
            statusCode: 404,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NOT_FOUND
        }
    }

    // get ticket and its comments
    const ticket = await prisma.ticket.findUnique({
        where: {
            id: parseInt(ticket_id)
        },
        include: {
            comments: true
        }
    }).catch((err) => {
        console.log(err)
        return
    })

    if(!ticket){
        return {
            statusCode: 404,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NOT_FOUND
        }
    }

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: ticket
        } as Payload
    } as HttpResponseTemplate
})