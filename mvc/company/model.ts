import {H3Event} from "h3";
import {getAllCompanies, getCompanyById} from "~/mvc/company/queries";
import {HttpResponseTemplate} from "~/types";

export async function getCompany(event:H3Event){
    const companyId = event.context.params?.id
    const response = {} as HttpResponseTemplate

    if (!companyId){
        response.statusCode = 404
        response.body = "Company Not Found"
        return response
    }

    const company = await getCompanyById(companyId)
    response.statusCode = 200
    response.body = company

    return response
}

export async function Companies(){
    let response = {} as HttpResponseTemplate
    const companies = await getAllCompanies()

    response.statusCode = 200
    response.body = companies

    return response
}