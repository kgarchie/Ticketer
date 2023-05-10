import prisma from "~/db";
import {SearchQuery, STATUS} from "~/types";
import {Ticket} from "@prisma/client";

export async function deleteUserComment(commentId: string | number) {
    // check for child comments
    const childComments = await prisma.comment.findMany({
        where: {
            parent: {
                id: Number(commentId)
            }
        }
    })

    const childCommentIds = childComments.map(comment => comment.id)

    await prisma.comment.deleteMany({
        where: {
            id: {
                in: childCommentIds
            }
        }
    })

    return prisma.comment.delete({
        where: {
            id: Number(commentId)
        },
        include: {
            ticket: true
        }
    })
}

export async function getTicketById(id: string | number) {
    return prisma.ticket.findUnique({
        where: {
            id: Number(id)
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function getTicketByReference(reference: string) {
    return prisma.ticket.findFirst({
        where: {
            reference: reference
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function createTicket(data: Ticket) {
    return prisma.ticket.create({
        data: data
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function createTicketComment(comment: string, commentor: string, ticketId: string | number, parentId: number | null = null) {
    let newComment = null

    if(parentId){
        newComment = await prisma.comment.create({
            data: {
                comment: comment,
                ticket: {
                    connect: {
                        id: Number(ticketId)
                    }
                },
                commentor: commentor,
                parent: {
                    connect: {
                        id: parentId || undefined
                    }
                }
            },
            include: {
                ticket: true
            }
        }).then(
             (comment) => {
                if(comment){
                    return comment
                } else {
                    return null
                }
             }
        ).catch(
            (error) => {
                console.log(error)
                return null
            }
        )
    }
    
    newComment = await prisma.comment.create({
        data: {
            comment: comment,
            ticket: {
                connect: {
                    id: Number(ticketId)
                }
            },
            commentor: commentor,
        },
        include: {
            ticket: true
        }
    }).catch(
        (error) => {
            console.log(error)
            return null
        }
    )

    return newComment
}

export async function closeUserTicket(id: string | number) {
    return prisma.ticket.update({
        where: {
            id: Number(id)
        },
        data: {
            status: STATUS.C
        }
    }).catch(
        (error) => {
            console.log(error)
            return null
        }
    )
}

export async function getUserTicket(ticketId: string | number) {
    return await prisma.ticket.findUnique({
        where: {
            id: Number(ticketId)
        },
        include: {
            comments: true
        }
    }).catch(
        error => {
            console.log(error)
        }
    )
}

export async function markTicketAsPending(ticketId: string | number) {
    return prisma.ticket.update({
        where: {
            id: Number(ticketId)
        },
        data: {
            status: STATUS.P
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function markTicketAsResolved(ticketId: string | number) {
    return prisma.ticket.update({
        where: {
            id: Number(ticketId)
        },
        data: {
            status: STATUS.R
        }
    }).catch(
        error => {
            console.log(error)
        }
    )
}

export async function ticketMetrics() {
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
        new_count: new_tickets_count,
        closed_count: closed_tickets_count,
        pending_count: pending_tickets_count,
        resolved_count: resolved_tickets_count
    }
}

export async function getNewTickets() {
    return prisma.ticket.findMany(
        {
            where: {
                status: STATUS.O
            }
        }
    )
}

export async function filterTickets(filter: STATUS | null, page: number | string) {
    return prisma.ticket.findMany({
        where: {
            status: filter || undefined
        },
        skip: Number(page) * 10,
        take: 10
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function getTicketsCreatedByUser(user_id: string) {
    return prisma.ticket.findMany({
        where: {
            creator: user_id
        }
    }).catch(
        error => {
            console.log(error)
            return []
        }
    )
}

export async function allSearchTickets(query: SearchQuery) {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                {
                    name: {
                        contains: query.userNameOrEmail || ''
                    }
                },
                {
                    email: {
                        contains: query.userNameOrEmail || ''
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

    const user_ids = users?.map(user => user.user_id)

    let userPossessingTickets = [] // NOTE: This is a 2D array
    for (const user_id of user_ids!) {
        userPossessingTickets.push(await getTicketsCreatedByUser(user_id))
    }

    const otherTickets = await prisma.ticket.findMany({
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

    // extract the tickets from the 2D array
    let resultTickets = []
    for (const userTickets of userPossessingTickets) {
        for (const ticket of userTickets) {
            resultTickets.push(ticket)
        }
    }

    // add the other tickets
    for (const ticket of otherTickets!) {
        resultTickets.push(ticket)
    }

    // remove duplicates
    resultTickets = resultTickets.filter((ticket, index, self) =>
            index === self.findIndex((t) => (
                t.id === ticket.id
            ))
    )

    return resultTickets
}


export async function deleteTicketById(id: string | number){
    // delete all comments
    await prisma.comment.deleteMany({
        where: {
            ticketId: Number(id)
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )

    return await prisma.ticket.delete({
        where: {
            id: Number(id)
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}
