import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType, Payload} from "~/types";

export default defineEventHandler(async (event) => {
    const user_id = event.context.params?.id as string | null;

    if (!user_id) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NO_USER_PROVIDED
        } as HttpResponseTemplate
    }

    const user = await prisma.user.findUnique({
        where: {
            user_id: user_id.toString()
        },
        select: {
            password: false,
            token: false,
            user_id: true,
            is_active: true,
            is_admin: true,
            email: true,
            name: true,
            company: true
        }
    }).then((user:any) => {
        return user
    }).catch((error:any) => {
        console.log(error);
        return null
    })

    if (user) {
        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: {
                data: user
            } as Payload
        } as HttpResponseTemplate
    }

    const ephemeral_user = await prisma.ephemeralUser.findUnique({
        where: {
            user_id: user_id.toString()
        }
    }).then((user:any) => {
        return user
    }).catch((error:any) => {
        console.log(error);
        return null
    })

    if (ephemeral_user) {
        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: {
                data: ephemeral_user
            } as Payload
        } as HttpResponseTemplate
    }

    return {
        statusCode: 404,
        type: HttpResponseType.ERROR,
        body: CannedResponseMessages.NOT_FOUND
    } as HttpResponseTemplate
});