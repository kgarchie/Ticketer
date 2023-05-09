import ticketsController from '~/mvc/tickets/controller'

export default defineEventHandler(async event => {
    return ticketsController(event)
})