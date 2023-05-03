import prisma from "~/helpers/script";

export default defineEventHandler(async () => {
    return prisma.paybill.findMany();
})