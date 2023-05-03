import prisma from "~/helpers/script"
import {HttpResponseTemplate, HttpResponseType, Payload, STATUS} from "~/types";

export default defineEventHandler(async () => {
    let all_tickets_count = await prisma.ticket.count()

    let new_tickets_count = await prisma.ticket.count({
        where: {
            status: STATUS.O
        }
    })

    let closed_tickets_count = await prisma.ticket.count({
        where: {
            status: STATUS.C
        }
    })

    let pending_tickets_count = await prisma.ticket.count({
        where: {
            status: STATUS.P
        }
    })

    let resolved_tickets_count = await prisma.ticket.count({
        where: {
            status: STATUS.R
        }
    })

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: {
                all_tickets_count: all_tickets_count,
                new_tickets_count: new_tickets_count,
                closed_tickets_count: closed_tickets_count,
                pending_tickets_count: pending_tickets_count,
                resolved_tickets_count: resolved_tickets_count
            }
        } as Payload
    } as HttpResponseTemplate
})