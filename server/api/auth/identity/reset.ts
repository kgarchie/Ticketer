import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseType} from "~/types";
import {mailResetPasswordLink} from "~/helpers/dbHelpers";

export default defineEventHandler(async (event) => {
    const {email, origin} = await readBody(event)

    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!user) {
        return {
            statusCode: 404,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.USER_NOT_FOUND
        }
    }

    // send email to user with reset link with token, store token in db
    const token = await prisma.token.create({
        data: {
            token: new Date().getTime().toString(36) + Math.random().toString(36).substr(2),
            User: {
                connect: {
                    user_id: user.user_id || undefined
                }
            }
        }
    })

    // send email, can use messageId to verify valid email
    const mailed = await mailResetPasswordLink(email, origin, token.token, user.user_id || "")

    if (mailed){
        // console.log(mailed)
        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: CannedResponseMessages.REQUEST_SUCCESS
        }
    }

    return {
        statusCode: 500,
        type: HttpResponseType.ERROR,
        body: CannedResponseMessages.INTERNAL_SERVER_ERROR
    }
})