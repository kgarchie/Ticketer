import type { DomainSettings, UserAuth } from "~/types";
import { H3Event } from "h3";
import { generateRandomToken, getAuthCookie, setAuthCookie } from "~/mvc/auth/helpers";
import prisma from "~/db";
import { v4 as uuidv4 } from "uuid";
import type { Token } from "@prisma/client";
import { validateLoginBody } from "~/mvc/auth/validations";

export async function loginUser(event: H3Event): Promise<UserAuth | null> {
    const authCookie = await getAuthCookie(event)
    const { companyName } = await readBody(event)
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
            User: {
                include: {
                    CompaniesOwned: true
                }
            }
        }
    });

    // If the token is valid, return the user auth object
    if (token && token.is_valid === true) {
        return {
            user_id: authCookie.user_id,
            auth_key: token.token,
            is_admin: token.User?.CompaniesOwned.some(c => c.name === companyName)
        } as UserAuth
    }

    // Otherwise:-
    // Try to authenticate with the login body i.e. email and password
    const loginBody = await validateLoginBody(event)
    if (!loginBody) return null

    // Try to authenticate and get a new token
    // @ts-ignore
    token = await loginWithEmailPassword(loginBody.email, loginBody.password, authCookie.auth_key)

    // If the token is created, return the new user auth object
    if (token && token.is_valid === true) {
        const user = {
            user_id: token.User?.user_id,
            auth_key: token.token,
            is_admin: token.User?.CompaniesOwned.some(c => c.name === companyName)
        } as UserAuth
        setAuthCookie(event, user)
        return user
    }

    // if all fails, return null
    return null
}


export async function loginWithEmailPassword(email: string, password: string, _token: string | null) {
    return await prisma.user.findFirst({
        where: {
            email: email
        }
    }).then(
        async (data) => {
            if (data && verifyPassword(password, data.password)) {
                prisma.token.updateMany({
                    where: {
                        token: _token || undefined,
                        User: {
                            email: email
                        }
                    },
                    data: {
                        is_valid: false
                    }
                })

                return prisma.token.create({
                    data: {
                        token: generateRandomToken(),
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

export async function createEphemeralUser(companyName: string) {
    return await prisma.ephemeralUser.create({
        data: {
            user_id: uuidv4(),
            is_active: true,
            Company: {
                connect: {
                    name: companyName
                }
            }
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

export async function createUser(data: { email: string, password: string, user_id: string, name: string, companyName: string }) {
    data.password = hashPassword(data.password)
    return await prisma.user.create({
        data: {
            email: data.email,
            password: data.password,
            user_id: data.user_id,
            name: data.name,
            CompaniesMember: {
                connect: {
                    name: data.companyName
                }
            }
        }, include: {
            CompaniesOwned: true
        }
    })
}

export async function createSuperUser(data: { email: string, user_id: string, password: string, company: { name: string, settings: DomainSettings } }) {
    data.password = hashPassword(data.password)
    return await prisma.user.create({
        data: {
            email: data.email,
            password: data.password,
            user_id: data.user_id,
            CompaniesOwned: {
                create: {
                    name: data.company.name,
                    settings: data.company.settings
                }
            }
        }
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

export async function updatePassword(user_id: string, password: string) {
    prisma.token.updateMany({
        where: {
            User: {
                user_id: user_id
            }
        },
        data: {
            is_valid: false
        }
    })


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

export async function saveNewToken(token: string, email: string, options: {
    validUser: boolean,
    detail?: string
} = { validUser: true }) {
    try {
        const data = options.validUser
            ? { User: { connect: { email } } }
            : { email };

        return await prisma.token.create({
            data: {
                ...data,
                token,
                detail: options?.detail
            },
            include: { User: {
                select: {
                    CompaniesOwned: true
                }
            } }
        });
    } catch (err) {
        console.log(err);
        return null;
    }
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

export async function getRegisteredUser(data: { user_id: string } | { email: string }) {
    return await prisma.user.findFirst({
        where: {
            OR: [
                {
                    // @ts-ignore
                    user_id: data.user_id || undefined
                },
                {
                    // @ts-ignore
                    email: data.email || undefined
                }
            ]
        },
        select: {
            password: false,
            Token: false,
            user_id: true,
        }
    }).catch((err) => {
        console.log(err)
        return null;
    })
}


export async function invalidateAllUserTokens(user_id: string) {
    return await prisma.token.updateMany({
        where: {
            User: {
                user_id: user_id
            }
        },
        data: {
            is_valid: false
        }
    }).catch((err) => {
        console.log(err)
        return null;
    })
}