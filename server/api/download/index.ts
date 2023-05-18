import downloadController from '~/mvc/download/controller'

export default defineEventHandler(async (event) => {
    return downloadController(event)
})