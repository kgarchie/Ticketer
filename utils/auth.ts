import type { UserAuth } from "~/types"

export function getAuthCookie() {
    const cookie = useCookie<UserAuth>("auth").value
    if(typeof cookie === "string") return null
    if ( // TODO: Maybe use Zod?
        !cookie ||
        cookie?.auth_key?.trim() === "" ||
        cookie?.user_id?.trim() === "" ||
        cookie?.auth_key === "undefined" ||
        cookie?.user_id === "undefined" ||
        cookie?.auth_key === "null" ||
        cookie?.user_id === "null" ||
        cookie?.auth_key === "false" ||
        cookie?.user_id === "false" ||
        !cookie?.auth_key ||
        !cookie?.user_id
    ) return null

    return cookie.auth_key
}

export function getAuthToken() {
    const state = useUser().value?.auth_key?.trim()
    const cookie = getAuthCookie()

    if (
        !state ||
        state === "undefined" ||
        state === "null" ||
        state === "false" ||
        state === ""
    ) return cookie
    return state
}

export function userIsAuthenticated() {
    console.log(getAuthToken())
    return !!getAuthToken()
}
