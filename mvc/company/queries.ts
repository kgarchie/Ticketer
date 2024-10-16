import prisma from "~/db";

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

export async function getUserCompany(data: { name: string, user: string}){
    
}

export async function getUserCompanies(data: { user: string}){
    
}