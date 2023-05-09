import userController from '~/mvc/user/controller'

export default defineEventHandler(async (event) => {
    return userController(event)
})