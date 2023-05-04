import prisma from "~/helpers/script"
import {HttpResponseTemplate, HttpResponseType, Payload, SearchQuery} from "~/types";

export default defineEventHandler(async (event) => {
    const query = await readBody(event) as SearchQuery

    // find database user with possible name or name containing the query name
    const users = await prisma.user.findMany({
        where: {
            OR: [
                {
                    name: {
                        contains: query.userNameOrEmail
                    }
                },
                {
                    email: {
                        contains: query.userNameOrEmail
                    }
                }
            ]
        }
    }).catch(
        (err) => {
            console.log(err)
            return null
        }
    )

    let ticketsWithUser: any[] | null = null

    if (users) {
        ticketsWithUser = await Promise.all(users.map(
            async (user) => {
                return await prisma.ticket.findMany({
                    where: {
                        user_id: user.user_id
                    }
                }).catch(
                    (err) => {
                        console.log(err)
                        return null
                    }
                )
            }
        ))
    }

    // find the ticket with each of the query params
    let tickets = await prisma.ticket.findMany({
        where: {
            transaction_date: {
                gte: query.date_from,
                lte: query.date_to
            },
            OR: [
                {
                    reference: query.reference_number
                }
            ]
        }
    }).catch(
        (err) => {
            console.log(err)
            return null
        })

    // merge the two arrays
    ticketsWithUser?.forEach(
        (ticket) => {
            tickets?.push(ticket)
        }
    )

    // remove duplicates
    tickets?.filter(
        (ticket, index, self) => {
            return self.indexOf(ticket) === index
        })

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: tickets
        } as Payload
    } as HttpResponseTemplate
})