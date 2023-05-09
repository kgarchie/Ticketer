import {UserAuth} from "~/types";
import {H3Event} from "h3";
import {generateRandomToken, getAuthCookie} from "~/mvc/auth/helpers";
import prisma from "~/db";
import {v4 as uuidv4} from "uuid";
import {Token} from "@prisma/client";
import {validateLoginBody} from "~/mvc/auth/validations";

export async function loginUser(event: H3Event): Promise<UserAuth | null> {
    const authCookie =  await getAuthCookie(event)
    if (!authCookie) return null

    // Try to authenticate with the cookie token
    let token = await prisma.token.findFirst({
        where: {
            token: authCookie.auth_key || undefined,
            User: {
                user_id: authCookie.user_id!
            }
        },
        include: {
            User: true
        }
    });

    // If the token is valid, return the user auth object
    if (token && token.is_valid === true) {
        return {
            user_id: authCookie.user_id,
            auth_key: token.token,
            is_admin: token?.User?.is_admin
        } as UserAuth
    }

    // Otherwise:-
    // Try to authenticate with the login body i.e. email and password
    const loginBody = await validateLoginBody(event)
    if (!loginBody) return null

    // Try to authenticate and get a new token
    token = await loginWithEmailPassword(loginBody.email, loginBody.password, authCookie.auth_key)

    // If the token is created, return the new user auth object
    if (token && token.is_valid === true) {
        return {
            user_id: token.User.user_id,
            auth_key: token.token,
            is_admin: token.User.is_admin
        } as UserAuth
    }

    // if all fails, return null
    return null
}


export async function loginWithEmailPassword(email: string, password: string, previous_token_string: string | null) {
    return await prisma.user.findFirst({
        where: {
            email: email
        }
    }).then(
        async (data) => {
            if (data && data.password == password) {
                if (previous_token_string == "") {
                    previous_token_string = null
                }

                let previous_token = await prisma.token.findFirst({
                    where: {
                        token: previous_token_string || undefined,
                        User: {
                            email: email
                        }
                    }
                })

                if (previous_token) {
                    await prisma.token.update({
                        where: {
                            id: previous_token.id
                        },
                        data: {
                            is_valid: false
                        }
                    })
                }

                let new_token = generateRandomToken()

                return prisma.token.create({
                    data: {
                        token: new_token,
                        User: {
                            connect: {
                                user_id: data.user_id || undefined
                            }
                        }
                    },
                    include: {
                        User: true
                    }
                });
            } else {
                return null
            }
        }
    ).catch(
        (error) => {
            console.log(error);
            return null
        })
}

export async function createEphemeralUser() {
    return await prisma.ephemeralUser.create({
        data: {
            user_id: uuidv4(),
            is_active: true
        }
    }).then(
        (data: any) => {
            return data
        }).catch(
        (error: any) => {
            console.log(error)
            return null
        }
    )
}

export async function createUser(email: string, password: string, is_admin: boolean, user_id: string, name: string, companyId: string | number) {
    return await prisma.user.create({
        data: {
            email: email,
            password: password,
            is_admin: is_admin,
            user_id: user_id,
            name: name,
            companyId: Number(companyId)
        }
    }).then(
        (data: any) => {
            return data
        }).catch(
        (error: any) => {
            console.log(error)
            return null
        })
}


export async function invalidateToken(token: Token) {
    return await prisma.token.update({
        where: {
            id: token.id
        },
        data: {
            is_valid: false
        }
    }).then(
        (data: any) => {
            if (data) {
                return true
            }
        }
    ).catch(
        (error: any) => {
            console.log(error)
            return false
        }
    )
}

export async function getToken(user_id: string, token: string | null) {
    return prisma.token.findFirst({
        where: {
            User: {
                user_id: user_id
            },
            // Might cause bugs
            token: token || undefined
        }
    });
}


export async function getUserOrEphemeralUser(user_id: string) {
    return await prisma.user.findUnique({
            where: {
                user_id: user_id
            }
        }).catch((err) => {
            console.log(err)
            return null;
        })  // Or:-
        || await prisma.ephemeralUser.findUnique({
            where: {
                user_id: user_id
            }
        }).catch((err) => {
            console.log(err)
            return null;
        })
}

export async function getUserFromEmail(email: string) {
    return await prisma.user.findFirst({
        where: {
            email: email
        }
    }).catch((err) => {
        console.log(err)
        return null;
    })
}

export function updatePassword(user_id: string, password: string) {
    return prisma.user.update({
        where: {
            user_id: user_id
        },
        data: {
            password: password
        }
    }).then(
        (data: any) => {
            if (data) {
                return data
            } else {
                return null
            }
        }
    ).catch((err) => {
        console.log(err)
        return null;
    })
}

export async function saveNewToken(token: string, email: string) {
    await invalidateToken(await getToken(email, token) as Token)

    return await prisma.token.create({
        data: {
            token: token,
            User: {
                connect: {
                    email: email
                }
            }
        },
        include: {
            User: true
        }
    }).catch((err) => {
        console.log(err)
        return null;
    })
}

export async function deleteEphemeralUser(user_id: string) {
    return await prisma.ephemeralUser.delete({
        where: {
            user_id: user_id
        }
    }).catch((err) => {
        console.log(err)
        return null;
    })
}
