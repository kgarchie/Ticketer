import {defineEventHandler, createRouter} from "h3";
import {readNotification, getNotifications} from "~/mvc/notifications/model";

const router = createRouter()

router.get('/:id/read', defineEventHandler(async event => {
    return await readNotification(event)
}))

router.post('/', defineEventHandler(async event => {
    return await getNotifications(event)
}))

export default useBase('/api/notifications', router.handler)