import notificationController from '~/mvc/notifications/controller'

export default defineEventHandler(async (event) => {
    return notificationController(event)
})