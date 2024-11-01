import {H3Event} from "h3";
import type {LoginCredentials} from "~/types";

export async function validateLoginBody(event: H3Event) {
    const credentials = await readBody(event) as LoginCredentials

    if (!credentials.email || !credentials.password) {
        return null
    }

    return credentials;
}