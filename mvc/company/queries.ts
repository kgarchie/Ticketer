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

export async function getUserCompany(data: { name: string, email: string } | { name: string, userId: number }) {
    return prisma.company.findFirst({
        where: {
            name: data.name,
            Owner: {
                OR: [
                    {
                        name: (data as any)?.name,
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
