import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType, Payload, STATUS} from "~/types";

export default defineEventHandler(async (event) => {
    const parameters = event.context.params?.parameters as string || null;

    if (!parameters) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.REQUEST_FAILED
        } as HttpResponseTemplate
    }

    // decode uriEncoded parameters
    let decoded_parameters = decodeURIComponent(parameters)

    const page = JSON.parse(decoded_parameters).page || 0
    const filter = JSON.parse(decoded_parameters).filter || null

    if(filter !== null){
    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: await prisma.ticket.findMany({
                where: {
                    status: filter || STATUS.O
                },
                skip: page * 10,
                take: 10
            })
        } as Payload
    } as HttpResponseTemplate}

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: await prisma.ticket.findMany({
                skip: page * 10,
            })
        } as Payload
    } as HttpResponseTemplate
})