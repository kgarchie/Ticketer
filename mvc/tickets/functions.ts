import {
    type HttpResponseTemplate,
    type SearchQuery,
    type SocketTemplate,
    STATUS,
    type TaggedPerson,
    TYPE
} from "~/types";
import { H3Event } from "h3";
import filestorage from "~/filestorage";
import {
    allSearchTickets,
    closeUserTicket,
    createTicket,
    createTicketComment,
    deleteTicketById,
    deleteUserComment,
    filterTickets,
    getNewTickets,
    getTicketAttachment as getAttachment,
    getTicketByReference,
    getUserTicket,
    markTicketAsPending,
    markTicketAsResolved,
    randomRapidSearch,
    ticketMetrics
} from "~/mvc/tickets/queries";
import { createAndShuttleNotification, shuttleDataToAllClients } from "~/mvc/utils";
import { getAuthCookie } from "~/mvc/auth/helpers";
import { type Ticket } from "@prisma/client";
import { getUserOrEphemeralUser_Secure } from "~/mvc/user/queries";
import { readFiles } from "h3-formidable";
import { join } from "pathe";
import { createTicketAttachment as createTicketAttachmentDB } from "./queries"

export async function deleteComment(event: H3Event) {
    const { commentId } = await readBody(event)
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate

    if (!commentId) {
        response.statusCode = 404
        response.body = "Bad Request"
        return response
    }

    const deletedComment = await deleteUserComment(commentId)

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.DELETE_COMMENT
    socketResponse.body = deletedComment

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = deletedComment

    return response
}


export async function makeComment(event: H3Event) {
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate

    const ticketId = event.context.params?.id

    if (!ticketId) {
        response.statusCode = 404
        response.body = "Ticket Not Found"
        return response
    }

    const { comment, commentor, parentId, tagged } = await readBody(event)
    if (!comment || !commentor || !ticketId) {
        response.statusCode = 404
        response.body = "Bad Request"
        return response
    }

    const tagged_people = tagged as TaggedPerson[] || []
    const newComment = await createTicketComment(comment, commentor, ticketId, parentId) || null

    if (!newComment) {
        response.statusCode = 500
        response.body = "Unable to create comment"
        return response
    }

    // @ts-ignore
    if (newComment.ticket.status !== STATUS.P || newComment.ticket.status !== STATUS.O) {
        await pendTicket(event, true)
    }

    const notificationMessage = `${comment.split(':')[0]} mentioned you in a comment | Ticket ref: ${newComment.ticket.reference}`

    if (tagged_people.length > 0) {
        for (const person of tagged_people) {
            createAndShuttleNotification(person.user_id, notificationMessage, TYPE.NOTIFICATION)
        }
    }

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.NEW_COMMENT
    socketResponse.body = newComment

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = newComment

    return response
}


export async function closeTicket(event: H3Event) {
    const ticketId = event.context.params?.id as string | null
    const { is_admin, user_id } = await getAuthCookie(event)
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate
    const user = await getUserOrEphemeralUser_Secure(user_id)

    if (!is_admin || user.is_admin == false || !ticketId) {
        response.statusCode = 401
        response.body = "Operation Failed"
        return response
    }

    const update = await closeUserTicket(ticketId)
    if (!update) {
        response.statusCode = 500
        response.body = "Internal Server Error"
    }

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.UPDATE_TICKET
    socketResponse.body = update

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = "Ticket Closed Successfully"

    return response
}

export async function getTicket(event: H3Event) {
    const ticketId = event.context.params?.id as string || null
    let response = {} as HttpResponseTemplate
    if (!ticketId) {
        response.statusCode = 401
        response.body = "Botched Post Request"
        return response
    }

    const ticket = await getUserTicket(ticketId)
    response.statusCode = 200
    response.body = ticket
    return response
}

export async function getTicketAttachment(event: H3Event){
    const ticketId = event.context.params?.id
    const attachmentId = event.context.params?.attachment
    let response = {} as HttpResponseTemplate
    if(!ticketId || !attachmentId){
        response.statusCode = 404
        response.body = "No such ticket"
    }

    return await getAttachment(attachmentId!)
}

export async function pendTicket(event: H3Event, force = false) {
    const ticketId = event.context.params?.id as string | null
    const { is_admin, user_id } = await getAuthCookie(event)
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate
    const user = await getUserOrEphemeralUser_Secure(user_id)

    if ((!is_admin || user.is_admin == false) && !force) {
        response.statusCode = 401
        response.body = "Operation Failed"
        return response
    }

    if (!ticketId) {
        response.statusCode = 404
        response.body = "Botched Post Request"
        return response
    }

    const update = await markTicketAsPending(ticketId)

    if (!update) {
        response.statusCode = 500
        response.body = "Internal Server Error"
        return response
    }

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.UPDATE_TICKET
    socketResponse.body = update

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = "Ticket Marked As Pending"
    return response
}


export async function resolveTicket(event: H3Event) {
    const ticketId = event.context.params?.id as string | null
    const { is_admin, user_id } = await getAuthCookie(event)
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate
    const user = await getUserOrEphemeralUser_Secure(user_id)

    if (!is_admin || user.is_admin == false || !ticketId) {
        response.statusCode = 401
        response.body = "Operation Failed"
        return response
    }

    const update = await markTicketAsResolved(ticketId)

    if (!update) {
        response.statusCode = 500
        response.body = "Internal Server Error"
        return response
    }

    socketResponse.statusCode = 200
    socketResponse.body = update
    socketResponse.type = TYPE.UPDATE_TICKET

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = "Ticket Marked As Resolved"
    return response
}

export async function filteredTickets(event: H3Event) {
    let parameters: any = event.context.params?.parameters as string || null
    let response = {} as HttpResponseTemplate

    if (!parameters) {
        response.statusCode = 404
        response.body = "Botched filter parameters"
        return response
    }

    parameters = decodeURI(parameters)
    parameters = JSON.parse(parameters)

    const page = parameters.page || 0
    const filter = parameters.filter as STATUS || null

    const tickets = await filterTickets(filter, page)

    response.statusCode = 200
    response.body = tickets

    return response
}

export async function newTickets() {
    let response = {} as HttpResponseTemplate

    response.statusCode = 200
    response.body = await getNewTickets()

    return response
}

export async function countTickets() {
    let response = {} as HttpResponseTemplate

    response.statusCode = 200
    response.body = await ticketMetrics()

    return response
}


export async function create(event: H3Event) {
    const data = await readFiles(event, { includeFields: true }) as any
    const _ticket = data.fields
    const ticket = {} as Ticket & { [key: string]: any }
    for (const key in _ticket) {
        const set = new Set(_ticket[key])
        ticket[key] = Array.from(set).at(-1)
    }
    const attachments = data.files as {attachment: File[]}
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate

    const existingTicket = await getTicketByReference(ticket.reference)
    if (existingTicket) {
        response.statusCode = 409
        response.body = "Ticket Already Exists"
        return response
    }


    const newTicket = (await createTicket(ticket)) as Ticket | null
    if (!newTicket) {
        response.statusCode = 500
        response.body = "Internal Server Error"
    }
    if (attachments?.attachment?.length) {
        const data = await createTicketAttachments(attachments.attachment, newTicket!.reference)
        data.forEach(async (datum) => {
            await createTicketAttachmentDB(newTicket!.id, datum)
        })
    }

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.NEW_TICKET
    socketResponse.body = newTicket

    shuttleDataToAllClients(socketResponse)
    const notifications =

    response.statusCode = 200
    response.body = newTicket

    return response
}

export async function search(event: H3Event) {
    const query = await readBody(event) as SearchQuery
    let response = {} as HttpResponseTemplate

    const tickets = await allSearchTickets(query)

    response.statusCode = 200
    response.body = tickets

    return response
}


export async function searchFilter(event: H3Event) {
    const query = event.context.params?.query as string || null
    let response = {} as HttpResponseTemplate

    if (!query) {
        response.statusCode = 404
        response.body = "Botched filter search parameters"
        return response
    }

    const tickets = await randomRapidSearch(query)

    response.statusCode = 200
    response.body = tickets

    return response
}


export async function deleteTicket(event: H3Event) {
    const ticketId = event.context.params?.id as string | null
    const { is_admin, user_id } = await getAuthCookie(event)
    let response = {} as HttpResponseTemplate
    let socketResponse = {} as SocketTemplate

    const user = await getUserOrEphemeralUser_Secure(user_id)

    if (!is_admin || user.is_admin == false || !ticketId) {
        response.statusCode = 401
        response.body = "Operation Failed"
        return response
    }

    const ticket = await deleteTicketById(ticketId)

    if (!ticket) {
        response.statusCode = 500
        response.body = "Internal Server Error"
        return response
    }

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.DELETE_TICKET
    socketResponse.body = ticket.id

    shuttleDataToAllClients(socketResponse)

    response.statusCode = 200
    response.body = "Ticket Deleted Successfully"

    return response
}

async function createTicketAttachments(attachments: File[], ticketUlid: string) {
    const data = [] as {
        name: string,
        size: number,
        url: string
    }[]
    await Promise.all(attachments.map(async (file) => {
        return await createAttachment(file, ticketUlid, data)
    }))

    return data
}

async function createAttachment(file: any, id: string, data: any[]) {
    const url = join("./tickets", id, file.originalFilename)
    await filestorage.setItem(url, file)
    data.push({
        name: file.originalFilename,
        size: file.size,
        url: url
    })
}