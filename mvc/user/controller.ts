import {createRouter, defineEventHandler} from "h3";
import {getAdminUsers, getUser, getUserTickets} from "~/mvc/user/functions";

const router = createRouter();

router.get("/:id", defineEventHandler(async (event) => {
    return await getUser(event)
}))

router.get("/:id/tickets", defineEventHandler(async (event) => {
    return await getUserTickets(event)
}))

router.get('/admins', defineEventHandler(async (event) => {
    return await getAdminUsers()
}))

export default useBase('/api/user', router.handler)
