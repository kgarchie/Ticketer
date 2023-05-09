import companyController from '~/mvc/company/controller'
export default defineEventHandler(async (event) => {
    return companyController(event)
})