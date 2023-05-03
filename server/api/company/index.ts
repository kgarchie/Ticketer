import prisma from "~/helpers/script";

export default defineEventHandler(()=>{
    return prisma.company.findMany()
})