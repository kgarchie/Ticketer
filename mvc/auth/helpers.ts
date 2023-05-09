import {H3Event} from "h3";
import {UserAuth} from "~/types";
import {createEphemeralUser} from "~/mvc/auth/queries";

export async function getAuthCookie(event: H3Event) {
    const user_auth_string = getCookie(event, "auth") || "{}"
    const user_auth = JSON.parse(user_auth_string) as UserAuth

    if (!user_auth.user_id) {
        const user = await createEphemeralUser()
        setAuthCookie(event, {
            user_id: user.user_id,
            auth_key: null,
            is_admin: false
        })

        return {
            user_id: user.user_id,
            auth_key: user.auth_key,
            is_admin: user.is_admin
        }
    }

    return user_auth
}
export function setAuthCookie(event:H3Event, userAuth: UserAuth) {
    setCookie(event, "auth", JSON.stringify({
        user_id: userAuth.user_id,
        auth_key: userAuth.auth_key,
        is_admin: userAuth.is_admin
    } as UserAuth), {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
    })
}
export function clearAuthCookie(event:H3Event) {
    deleteCookie(event, "auth")
}
export function generateRandomToken(){
    return new Date().getTime().toString(36) + Math.random().toString(36).substr(2)
}