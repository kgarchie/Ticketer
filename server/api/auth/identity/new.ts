import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseType, UserAuth} from "~/types";
import {loginWithEmailPassword} from "~/helpers/dbHelpers";

export default defineEventHandler(async (event) => {
    const {user_id, token, password, email} = await readBody(event)

    const user = await prisma.user.update({
        where: {
            user_id: user_id
        },
        data: {
            password: password
        }
    })

    if (!user) {
        return {
            statusCode: 401,
            type: HttpResponseType.FORBIDDEN,
            body: CannedResponseMessages.USER_NOT_FOUND
        }
    }

    const reset_token = await prisma.token.findFirst(
        {
            where: {
                token: token,
                User: {
                    user_id: user_id
                }
            }
        }
    ).then(
        (data) => {
            if(data && data.is_valid){
                return data
            } else {
                return null
            }
        }
    ).catch(
        (error) => {
            return null
        }
    )

    if (!reset_token) {
        return {
            statusCode: 401,
            type: HttpResponseType.FORBIDDEN,
            body: CannedResponseMessages.REQUEST_FAILED
        }
    }

    const new_token = await loginWithEmailPassword(email, password, reset_token.token)

    setCookie(event, "auth", JSON.stringify({
        user_id: user.user_id,
        auth_key: new_token?.token,
        is_admin: new_token?.User?.is_admin
    } as UserAuth), {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
    })

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: CannedResponseMessages.REQUEST_SUCCESS
    }
})