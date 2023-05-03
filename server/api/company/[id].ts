import prisma from "~/helpers/script";
import {CannedResponseMessages, HttpResponseTemplate, HttpResponseType} from "~/types";

export default defineEventHandler(async (event) => {
    let companyId = event.context.params?.id as string | null;

    if (!companyId) {
        return {
            status: 400,
            body: CannedResponseMessages.NO_COMPANY_ID_PROVIDED
        };
    }

    const company = await prisma.company.findUnique({
        where: {
            id: parseInt(companyId)
        }
    }).then((company:any) => {
        return company
    }).catch((err:any) => {
        console.log(err);
        return null
    })

    if (company === null) {
        return {
            statusCode: 404,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.NOT_FOUND
        } as HttpResponseTemplate
    }

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: company
    } as HttpResponseTemplate
})