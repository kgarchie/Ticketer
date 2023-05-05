import prisma from "~/helpers/script";
import {Ticket} from "@prisma/client";
import {
    CannedResponseMessages,
    CHOICES,
    HttpResponseTemplate,
    HttpResponseType,
    Payload,
    SocketResponseTemplate,
    SocketResponseType,
    STATUS,
    URGENCY
} from "~/types";
import {notifyAllAndConnectedAdmins} from "~/helpers/socketHelpers";

export default defineEventHandler(async (event) => {
    // handle post request
    const ticket = await readBody(event) as Ticket

    // check if reference is unique
    const ticketExists = await prisma.ticket.findUnique({
        where: {
            reference: ticket.reference.toString()
        }
    }).then(
        (ticket) => ticket !== null
    ).catch(
        (err) => {
            console.log(err)
            return false
        }
    )

    if (ticketExists) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.TICKET_EXISTS
        } as HttpResponseTemplate
    }
    // parse ticket data and change to DB compatible format
    ticket.transaction_date = new Date(ticket.transaction_date)
    ticket.amount = parseFloat(ticket.amount.toString())
    ticket.paybill_no = ticket.paybill_no.toString()
    ticket.status = STATUS.O

    // create ticket in prisma database
    const createdTicket = await prisma.ticket.create({
        data: ticket
    })

    // return created ticket and ok status
    if (createdTicket as Ticket) {
        const response = {
            statusCode: 200,
            type: SocketResponseType.TICKET,
            body: {
                data: createdTicket
            } as Payload
        } as SocketResponseTemplate

        notifyAllAndConnectedAdmins(response, createdTicket.user_id?.toString() || null)

        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: CannedResponseMessages.REQUEST_SUCCESS,
        } as HttpResponseTemplate
    } else {
        return {
            statusCode: 500,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.CANT_CREATE_TICKET
        } as HttpResponseTemplate
    }
})