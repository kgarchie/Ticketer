import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType} from "~/types";

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id as string | null;

    if (!id) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NO_ID_PROVIDED
        } as HttpResponseTemplate
    }

    return await prisma.notification.update(
        {
            where: {
                id: parseInt(id)
            },
            data: {
                opened: true
            }
        }
    ).then(
        (data) => {
            if (data){
                return{
                    statusCode: 200,
                    type: HttpResponseType.SUCCESS,
                    body: CannedResponseMessages.REQUEST_SUCCESS
                } as HttpResponseTemplate
            } else {
                return {
                    statusCode: 404,
                    type: HttpResponseType.ERROR,
                    body: CannedResponseMessages.NOT_FOUND
                } as HttpResponseTemplate
            }
        }
    ).catch(
        (error) => {
            console.log(error);
            return {
                statusCode: 500,
                type: HttpResponseType.ERROR,
                body: CannedResponseMessages.INTERNAL_SERVER_ERROR
            } as HttpResponseTemplate
        }
    )
})