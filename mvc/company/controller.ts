import {createRouter, defineEventHandler} from "h3";
import {Companies, getCompany} from "~/mvc/company/functions";

const router = createRouter()

router.get('/:id', defineEventHandler(async event => {
    return await getCompany(event)
}))

router.get('/', defineEventHandler(async event => {
    return await Companies()
}))

export default useBase('/api/company', router.handler)