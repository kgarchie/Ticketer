import notificationsController from '~/mvc/notifications/controller'

export default defineEventHandler(async (event) => {
    return notificationsController(event)
})