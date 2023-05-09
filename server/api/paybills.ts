import prisma from "~/db";

export default defineEventHandler(async () => {
    return prisma.paybill.findMany();
})