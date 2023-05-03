import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType, UserAuth} from "~/types";
import {v4 as uuidv4} from "uuid";

export default defineEventHandler(async (event) => {
    let raw_user_auth = getCookie(event, "auth") || null;
    let user_auth = raw_user_auth ? JSON.parse(raw_user_auth) as UserAuth : null;

    async function createEphemeralUser() {
        return await prisma.ephemeralUser.create({
            data: {
                user_id: uuidv4(),
                is_active: true
            }
        }).then(
            async (data: any) => {
                await setCookie(event, "auth", JSON.stringify({
                    user_id: data.user_id,
                    auth_key: null,
                    is_admin: false
                } as UserAuth), {
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
                })

                const payload = {
                    data: {
                        user_id: data.user_id,
                        is_admin: false,
                        auth_key: null
                    } as UserAuth
                }

                return {
                    statusCode: 200,
                    type: HttpResponseType.SUCCESS,
                    body: payload
                } as HttpResponseTemplate
            }).catch(
            (error: any) => {
                console.log(error)
                return {
                    statusCode: 500,
                    type: HttpResponseType.ERROR,
                    body: CannedResponseMessages.USER_NOT_FOUND + error.toString()
                }
            }
        )
    }

    if (user_auth) {
        let user: any;

        user = await prisma.ephemeralUser.findUnique({
            where: {
                user_id: user_auth.user_id
            }
        }).then(
            (data: any) => {
                if (data) {
                    const payload = {
                        data: {
                            user_id: data.user_id,
                            is_admin: false,
                            auth_key: null
                        } as UserAuth
                    }

                    return {
                        statusCode: 200,
                        type: HttpResponseType.SUCCESS,
                        body: payload
                    }
                } else {
                    return null
                }
            })

        if (user) {
            return user
        }

        user = await prisma.user.findUnique({
            where: {
                user_id: user_auth.user_id
            }
        }).then(
            (data: any) => {
                if (data) {
                    const payload = {
                        data: {
                            user_id: data.user_id,
                            is_admin: data.is_admin,
                            auth_key: data.token
                        } as UserAuth
                    }

                    return {
                        statusCode: 200,
                        type: HttpResponseType.SUCCESS,
                        body: payload
                    } as HttpResponseTemplate
                } else {
                    return null
                }
            }
        )

        if (user) {
            return user
        }

        return createEphemeralUser()
    } else {
        return createEphemeralUser()
    }
})