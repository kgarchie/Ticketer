import {createRouter, defineEventHandler} from "h3";
import {
    closeTicket, countTickets, create,
    deleteComment,
    filteredTickets,
    getTicket,
    makeComment, newTickets,
    pendTicket,
    resolveTicket,
    search,
    deleteTicket,
    searchFilter,
    getTicketAttachment
} from "./functions";

const router = createRouter()

router.post('/:id/comment/delete', defineEventHandler(async event => {
    return await deleteComment(event)
}))

router.post('/:id/comment', defineEventHandler(async event => {
    return await makeComment(event)
}))

router.post('/:id/close', defineEventHandler(async event => {
    return await closeTicket(event)
}))

router.get('/:id', defineEventHandler(async event => {
    return await getTicket(event)
}))

router.get('/:id/attachment/:attachment', defineEventHandler(async event => {
    return await getTicketAttachment(event)
}))

router.get('/:id/pend', defineEventHandler(async event => {
    return await pendTicket(event)
}))

router.post('/:id/resolve', defineEventHandler(async event => {
    return await resolveTicket(event)
}))

router.delete('/:id', defineEventHandler(async event => {
    return await deleteTicket(event)
}))

router.get('/query/count', defineEventHandler(async event => {
    return await countTickets()
}))

router.get('/query/new', defineEventHandler(async event => {
    return await newTickets()
}))

router.get('/query/:parameters', defineEventHandler(async event => {
    return await filteredTickets(event)
}))

router.post('/create', defineEventHandler(async event => {
    return await create(event)
}))

router.post('/search', defineEventHandler(async event => {
    return await search(event)
}))

router.get('/search/:query', defineEventHandler(async event => {
    return await searchFilter(event)
}))

export default useBase('/api/tickets', router.handler)