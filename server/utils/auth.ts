import type {H3Event} from "h3"

export function readAuthToken(event: H3Event, key: string) {
    let auth = event.headers.get("Authorization") || null
    if (!auth) auth = getCookie(event, "Authorization") || null
    if (!auth) return null

    let _key;
    let token;
    let parts = auth.split(" ")
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === key) {
            _key = parts[i]
            token = parts[i + 1]
            break
        }
    }

    token = token?.trim()
    if (
        !token ||
        token === "undefined" ||
        token === "null" ||
        token === "false" ||
        token === ""
    ) return null

    return token
}