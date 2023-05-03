import prisma from "~/helpers/script";
import {adminUser, CannedResponseMessages, HttpResponseTemplate, HttpResponseType, Payload} from "~/types";

export default defineEventHandler( () => {
    return prisma.user.findMany({
        where: {
            is_admin: true
        },
        include: {
            company: true
        }
    }).then(
        (data) => {
            if (data) {
                return {
                    statusCode: 200,
                    type: HttpResponseType.SUCCESS,
                    body: {
                        data: data.map((user) => {
                            return {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                company: user.company,
                                is_admin: user.is_admin,
                                user_id: user.user_id
                            } as adminUser
                        })
                    } as Payload
                } as HttpResponseTemplate
            } else {
                return {
                    statusCode: 500,
                    type: HttpResponseType.ERROR,
                    body: CannedResponseMessages.REQUEST_FAILED
                } as HttpResponseTemplate
            }
        }
    ).catch((err) => {
        console.log(err)
        return {
            statusCode: 500,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.REQUEST_FAILED
        } as HttpResponseTemplate
    })
})