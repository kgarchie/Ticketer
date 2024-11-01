import { H3Event } from "h3";
import { CONFIRMATION_TEMPLATE, TokenDetail, type HttpResponseTemplate, INVITATON_TEMPLATE } from "~/types";
import {
    createUser, deleteEphemeralUser, getRegisteredUser,
    getToken, getUserFromEmail,
    getUserOrEphemeralUser, invalidateAllUserTokens, invalidateToken,
    loginUser, loginWithEmailPassword,
    saveNewToken,
    updatePassword
} from "~/mvc/auth/queries";
import { clearAuthCookie, generateRandomToken, getAuthCookie, setAuthCookie } from "~/mvc/auth/helpers";
import { mailResetPasswordLink, sendMail } from "~/mvc/utils";
import { string, z } from "zod";
import { getCompanyMember } from "../company/queries";

export async function login(event: H3Event): Promise<HttpResponseTemplate> {
    let response = {} as HttpResponseTemplate;

    // TODO: Check Platform - If API will be used by mobile app, there will be no cookies

    const UserAuthOrNull = await loginUser(event)

    if (!UserAuthOrNull) {
        response.statusCode = 401;
        response.body = "Unauthorized"
        return response;
    }

    response.statusCode = 200;
    response.body = UserAuthOrNull;
    return response;
}

export async function logout(event: H3Event) {
    let response = {} as HttpResponseTemplate;

    const userAuth = await getAuthCookie(event)

    const token = await getToken(userAuth.user_id, userAuth.auth_key)

    await invalidateToken(token!)

    clearAuthCookie(event)

    response.statusCode = 200;
    response.body = "Logged out"
    return response;
}

export async function identify(event: H3Event) {
    let response = {} as HttpResponseTemplate;

    // TODO: Check Platform - If API will be used by mobile app, there will be no cookies

    const { user_id, auth_key } = await getAuthCookie(event)

    let user = await getUserOrEphemeralUser(user_id)
    let token = await getToken(user_id, auth_key)

    if (token && token.is_valid === true) {
        response.statusCode = 200;
        response.body = user;
        return response;
    } else if (token && token.is_valid === false) {
        clearAuthCookie(event)
        response.statusCode = 401;
        response.body = "Unauthorized"
        return response;
    }

    response.statusCode = 200;
    response.body = user;
    return response;
}


export async function getUserToken(event: H3Event) {
    let response = {} as HttpResponseTemplate;

    const { user_id, auth_key } = await getAuthCookie(event)
    if (!auth_key || auth_key.trim() === "") {
        response.statusCode = 200;
        response.body = "Not Logged In";
        return response;
    }

    let token = await getToken(user_id, auth_key)

    if (token && token.is_valid === true) {
        response.statusCode = 200;
        response.body = token;
        return response;
    } else if (token && token.is_valid === false) {
        clearAuthCookie(event)
        response.statusCode = 401;
        response.body = "Unauthorized"
        return response;
    } else if (!token) {
        response.statusCode = 404;
        response.body = "Forbidden"
        return response;
    } else {
        response.statusCode = 500;
        response.body = "Server Error"
        return response;
    }
}


export async function saveNewPassword(event: H3Event) {
    let response = {} as HttpResponseTemplate;
    const { user_id, token, password, email, companyName } = await readBody(event)

    // check if token is valid
    const tokenOrNull = await getToken(user_id, token)

    if (!tokenOrNull || tokenOrNull.is_valid === false) {
        response.statusCode = 401;
        response.body = "Unauthorized | Token Invalid/Expired! Try Again"
        return response;
    }

    await invalidateToken(tokenOrNull)

    const updatedUserOrNull = await updatePassword(user_id, password)
    const newToken = await saveNewToken(generateRandomToken(), email)

    if (updatedUserOrNull && newToken) {
        setAuthCookie(event, {
            user_id: updatedUserOrNull?.user_id,
            auth_key: newToken?.token,
            is_admin: newToken.User?.CompaniesOwned.some(c => c.name === companyName) || false
        })

        response.statusCode = 200;
        response.body = "Password Updated";
        return response;
    }

    response.statusCode = 401;
    response.body = "Unauthorized"
    return response;
}

export async function register(event: H3Event) {
    let response = {} as HttpResponseTemplate;
    const schema = z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string(),
        companyName: z.string()
    })
    const { data, error } = await readValidatedBody(event, schema.safeParse)
    if (!data || error) {
        response.statusCode = 400;
        response.body = error?.message || "Bad Request"
        return response;
    }

    const { user_id } = await getAuthCookie(event)

    const userExists = await getCompanyMember({ email: data.email, companyName: data.companyName })

    if (userExists) {
        response.statusCode = 401;
        response.body = "User Already Exists"
        return response;
    }

    const user = await createUser({ ...data, user_id: user_id })

    const token = await loginWithEmailPassword(data.email, data.password, null)

    if (!user || !token) {
        response.statusCode = 500;
        response.body = "Internal Server Error"
        return response;
    }

    setAuthCookie(event, {
        user_id: user?.user_id,
        auth_key: token?.token,
        is_admin: user?.CompaniesOwned.some(c => c.name === data.companyName)
    })

    deleteEphemeralUser(user_id)

    response.statusCode = 200;
    response.body = user;
    return response;
}

export async function reset(event: H3Event) {
    const response = {} as HttpResponseTemplate;
    const { email, origin } = await readBody(event)

    const user = await getUserFromEmail(email)
    if (!user) {
        response.statusCode = 404;
        response.body = "User Not Found"
        return response;
    }

    const token = await saveNewToken(generateRandomToken(), email)

    if (!token) {
        response.statusCode = 500;
        response.body = "Internal Server Error"
        return response;
    }

    await mailResetPasswordLink(email, origin, token.token, user.user_id)

    clearAuthCookie(event)

    response.statusCode = 200;
    response.body = "Reset Link Sent"
    return response;
}


export async function sendOnboardingEmailValidation({ email, origin }: { email: string, origin: string }) {
    const token = Math.floor(100000 + Math.random() * 900000).toString()

    const message = `Your verification code is ${token}`
    await saveNewToken(token, email, {validUser: false})

    const options = {
        to: email,
        subject: "Email Code Verification",
        text: message,
        html: CONFIRMATION_TEMPLATE(token)
    }

    console.log(message)

    return await sendMail(options)
}


export async function sendOnboadingEmailInvite({ email, origin }: { email: string, origin: string }) {
    const token = generateRandomToken()
    const link = `${origin}/invite?token=${token}&email=${email}`

    const message = `You have been invited to join ticketing our platform. Click the link below to join`
    await saveNewToken(token, email, {validUser: false, detail: TokenDetail.invite})

    const options = {
        to: email,
        subject: "Invitation to Join Ticketing",
        text: message,
        html: INVITATON_TEMPLATE(link)
    }

    console.log(link)

    return await sendMail(options)
}