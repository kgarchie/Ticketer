import authController from '~/mvc/auth/controller'
export default defineEventHandler(async (event) => {
    return authController(event);
})