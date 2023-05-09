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