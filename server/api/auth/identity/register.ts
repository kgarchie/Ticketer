import prisma from "~/helpers/script";
import {CannedResponseMessages, Payload, HttpResponseTemplate, HttpResponseType, UserAuth} from "~/types";
import {loginWithEmailPassword} from "~/helpers/dbHelpers";


export default defineEventHandler(async (event) => {
    let raw_user_auth = getCookie(event, "auth") || null;
    let user_auth = raw_user_auth ? JSON.parse(raw_user_auth) : null;

    if (!user_auth) {
        user_auth = {
            user_id: '',
            auth_key: '',
            is_admin: false
        } as UserAuth
    }

    let details = await readBody(event);

    if (!details) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NO_DETAILS_PROVIDED
        } as HttpResponseTemplate
    }

    let user = user_auth as UserAuth

    if (user && user.user_id) {
        let db_user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        user_id: user.user_id
                    },
                    {
                        email: details.email
                    }
                ]
            }
        }).then(
            (data:any) => {
                if (data) {
                    return data
                }
            }).catch(
            (error:any) => {
                console.log(error);
                return null
            }
        )

        if (db_user) {
            return {
                statusCode: 400,
                type: HttpResponseType.ERROR,
                body: CannedResponseMessages.USER_ALREADY_EXISTS
            } as HttpResponseTemplate
        }

        // create the user
        let new_user = await prisma.user.create({
            data: {
                user_id: user.user_id,
                is_admin: false,
                name: details.name,
                email: details.email,
                companyId: details.company == "" ? undefined : parseInt(details.company),
                password: details.password
            }
        }).then(
            async (data:any) => {
                if (data) {
                    await prisma.ephemeralUser.delete(
                        {
                            where: {
                                user_id: user.user_id
                            }
                        }
                    ).catch(
                        (error) => {
                            console.log(error)
                        }
                    )
                    return data
                } else {
                    return null
                }
            }
        ).catch(
            (error:any) => {
                console.log(error)
                return null
            }
        )

        const new_token = await loginWithEmailPassword(new_user.email, new_user.password, null)

        setCookie(event, "auth", JSON.stringify({
            user_id: user.user_id,
            auth_key: new_token?.token,
            is_admin: new_token?.User?.is_admin
        } as UserAuth), {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
        })

        const payload = {
            data: new_user
        } as Payload

        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: payload
        } as HttpResponseTemplate
    } else {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.USER_NOT_FOUND
        } as HttpResponseTemplate
    }
})