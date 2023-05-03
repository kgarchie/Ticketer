import {CannedResponseMessages, LoginCredentials, HttpResponseTemplate, HttpResponseType, UserAuth} from "~/types";
import prisma from "~/helpers/script";
import {loginWithEmailPassword} from "~/helpers/dbHelpers";

export default defineEventHandler(async (event) => {
    const user_auth = getCookie(event, "auth") || null;

    if (!user_auth) {
        return {
            statusCode: 401,
            type: HttpResponseType.FORBIDDEN,
            body: CannedResponseMessages.NO_AUTH_COOKIE
        } as HttpResponseTemplate
    }

    const {user_id, auth_key} = JSON.parse(user_auth) as UserAuth

    const details = await readBody(event) as LoginCredentials;

    if (!details && user_id) {
        const token = await prisma.token.findFirst({
            where: {
                token: auth_key || undefined,
                User: {
                    user_id: user_id
                }
            },
            include: {
                User: true
            }
        });

        if (token && token.is_valid === true) {
            return {
                statusCode: 200,
                type: HttpResponseType.SUCCESS,
                body: CannedResponseMessages.LOGIN_SUCCESS
            } as HttpResponseTemplate
        }

        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.LOGIN_FAILED
        } as HttpResponseTemplate
    } else {
        const token = await loginWithEmailPassword(details.email, details.password, auth_key)

        if (token && token.is_valid === true){
            setCookie(event, "auth", JSON.stringify({
                user_id: user_id,
                auth_key: token.token,
                is_admin: token?.User?.is_admin
            } as UserAuth), {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
            })

            return {
                statusCode: 200,
                type: HttpResponseType.SUCCESS,
                body: CannedResponseMessages.LOGIN_SUCCESS
            } as HttpResponseTemplate
        } else {
            return {
                statusCode: 400,
                type: HttpResponseType.ERROR,
                body: CannedResponseMessages.LOGIN_FAILED
            } as HttpResponseTemplate
        }
    }
})