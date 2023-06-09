import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DEV === 'true' ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL,
        }
    }
})
export default prisma