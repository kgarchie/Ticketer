import prisma from "~/db";
import type { DomainSettings } from "~/types";

export async function getCompanyById(id: string | number) {
    return prisma.company.findUnique({
        where: {
            id: Number(id)
        }
    }).catch(
        (err) => {
            console.log(err)
            return null
        }
    )
}

export async function getAllCompanies() {
    return prisma.company.findMany()
}

export async function getCompanyByName(name: string) {
    return await prisma.company.findUnique({
        where: {
            name: name
        }
    })
}

export async function getUserCompany(data: { companyName: string, userEmail: string } | { companyName: string, userId: number }) {
    return prisma.company.findFirst({
        where: {
            name: data.companyName,
            Owner: {
                OR: [
                    {
                        id: (data as any)?.userId,
                        email: (data as any)?.email
                    }
                ]
            }
        }
    })
}

export async function getUserCompanies(userId: number) {
    return prisma.company.findMany({
        where: {
            ownerId: userId
        }
    })
}


export async function createCompany(data: {settings: DomainSettings, name: string, ownerId: number}) {
    return await prisma.company.create({
        data: data
    })
}


export async function getCompanyMember(data: { user_id: string } | { email: string } & { companyName: string }) {
    return await prisma.user.findFirst({
        where: {
            AND: {
                OR: [
                    {
                        // @ts-ignore
                        user_id: data.user_id || undefined
                    },
                    {
                        // @ts-ignore
                        email: data.email || undefined
                    }
                ],
                CompaniesOwned: {
                    every: {
                        // @ts-ignore
                        name: data.companyName
                    }
                },
                CompaniesMember: {
                    some: {
                        // @ts-ignore
                        name: data.companyName
                    }
                }
            }
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