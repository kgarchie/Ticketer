import prisma from "~/db";
import { getCompanyById, getCompanyByName } from "../company/queries";
import type { EphemeralUser, User } from "@prisma/client";

export async function getAdmins(company: {companyName: string} | { companyId: number}) {
    // @ts-ignore
    const _company = company?.companyName ? await getCompanyByName(company.companyName) : await getCompanyById(company.companyId)
    return await prisma.user.findMany({
        where: {
            CompaniesOwned: {
                some: {
                    name: _company?.name
                }
            },
            CompaniesMember: {
                some: {
                    settings: {
                        path: ["managers"],
                        array_contains: _company?.name
                    }
                }
            }
        },
        select: {
            name: true,
            email: true,
            CompaniesMember: true,
            user_id: true,
            password: false,
            companyId: true
        }
    }).catch(
        (error) => {
            console.log(error);
            return []
        }
    )
}

export async function getUserOrEphemeralUser_Secure(user_id: string | undefined) {
    return await prisma.user.findUnique({
        where: {
            user_id: user_id
        },
        select: {
            name: true,
            email: true,
            CompaniesMember: true,
            user_id: true,
            companyId: true
        }
    }) || await prisma.ephemeralUser.findUnique({
        where: {
            user_id: user_id
        }
    }).then(
        async (data) => {
            return {
                ...data,
                name: 'Anonymous',
                email: 'Anonymous',
                company: (await getCompanyById(data!.id))?.name,
                companyId: data!.companyId,
                is_admin: false,
                user_id: user_id
            }
        }
    ) || null
}

export async function getUserName(user_id: string) {
    const user = await getUserOrEphemeralUser_Secure(user_id)

    if (user) {
        return user.name
    } else {
        return user_id
    }
}

export async function getUserNameOrUser_Id(user_id: string | null) {
    const user = await getUserOrEphemeralUser_Secure(user_id!)

    if (user && user.name !== 'Anonymous') {
        return user.name
    } else {
        return user_id
    }
}

export async function getUserFromName(name: string) {
    return await prisma.user.findFirst({
        where: {
            name: name
        }
    })
}

export async function getOnboardingUser({ email, token }: { email: string, token: string }) {
    const user = await prisma.token.findMany({
        where: {
            email: email,
            token: token,
            is_valid: true
        }
    }).then(results => {
        if (results.length > 0) {
            return results[0]
        }
        return null
    }).catch(e => {
        console.log(e)
        return null
    })

    if (user) {
        await prisma.token.updateMany({
            where: {
                email: email,
                token: token,
                is_valid: true
            },
            data: {
                is_valid: false
            }
        }).catch(e => {
            console.log(e)
            return null
        })

        return email
    }

    return false
}