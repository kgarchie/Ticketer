import prisma from "~/helpers/script"
import {
    Action,
    Actor,
    CannedResponseMessages, Payload,
    SocketResponseTemplate,
    SocketResponseType,
    STATUS,
    TicketAct
} from "~/types";
import {notifyAllConnectedClients} from "~/helpers/socketHelpers";

export default defineEventHandler(async (event) => {
    const ticket_id = event.context.params?.id as string | null;

    if (!ticket_id) {
        return {
            statusCode: 400,
            body: CannedResponseMessages.NO_ID_PROVIDED
        }
    }

    const resolve = await prisma.ticket.update({
        where: {
            id: parseInt(ticket_id)
        },
        data: {
            status: STATUS.R
        }
    }).then(
        (ticket) => {
            return ticket
        }
    ).catch(
        (err) => {
            console.log(err)
            return null
        }
    )

    // notify connected clients
    if (resolve) {
        const response = {
            statusCode: 200,
            type: SocketResponseType.ACTION,
            body: {
                actor: Actor.TICKET,
                payload: {
                    data: {
                        action: TicketAct.RESOLVE,
                        ticket: resolve
                    }
                } as Payload
            } as Action
        } as SocketResponseTemplate

        notifyAllConnectedClients(response)

        return {
            statusCode: 200,
            body: resolve
        }
    }

    return {
        statusCode: 400,
        body: CannedResponseMessages.REQUEST_FAILED
    }
})