import prisma from "~/db";
import {type SearchQuery, STATUS} from "~/types";
import {type Ticket} from "@prisma/client";
import filestorage from "~/filestorage";
import { ulid } from "ulid";

export async function deleteUserComment(commentId: string | number) {
    // check for child comments
    const childComments = await prisma.comment.findMany({
        where: {
            Parent: {
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
            Ticket: true
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
        },
        include: {
            Company: true
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function createTicket(data: Ticket) {
    data.status = STATUS.O
    return prisma.ticket.create({
        data: data
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )
}

export async function createTicketAttachment(ticketId: number, data: {
    url: string,
    name: string,
    size: number
}) {
    return await prisma.attachment.create({
        data: {
            Ticket: {
                connect: {
                    id: ticketId
                },
            },
            name: data.name || ulid(),
            size: data.size,
            url: data.url
        }
    }).catch(
        error => {
            console.log(error)
            return null
        }
    )   
}

export async function createTicketComment(comment: string, commentor: string, ticketId: string | number, parentId: number | null = null) {
    let newComment;

    if (parentId) {
        newComment = await prisma.comment.create({
            data: {
                comment: comment,
                Ticket: {
                    connect: {
                        id: Number(ticketId)
                    }
                },
                commentor: commentor,
                Parent: {
                    connect: {
                        id: parentId || undefined
                    }
                }
            },
            include: {
                Ticket: true
            }
        }).then(
            (comment) => {
                if (comment) {
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
    } else {
        newComment = await prisma.comment.create({
            data: {
                comment: comment,
                Ticket: {
                    connect: {
                        id: Number(ticketId)
                    }
                },
                commentor: commentor,
            },
            include: {
                Ticket: true
            }
        }).catch(
            (error) => {
                console.log(error)
                return null
            }
        )
    }

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
            Comments: true,
            Attachment: true
        },
    }).catch(
        error => {
            console.log(error)
        }
    )
}

export async function getTicketAttachment(id: string) {
    return filestorage.getItem(id)
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
            return null
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
        take: 10,
        orderBy: {
            id: 'desc' // Sort by id in descending order i.e. latest first
        }
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
                        contains: query.userNameOrEmail?.trim() === '' ? undefined : query.userNameOrEmail
                    }
                },
                {
                    email: {
                        contains: query.userNameOrEmail?.trim() === '' ? undefined : query.userNameOrEmail
                    }
                }
            ]
        }
    }).catch(
        (err) => {
            console.log(err)
            return []
        }
    )

    const user_ids = users?.map(user => user.user_id)

    let userPossessingTickets = [] // NOTE: This will be a 2D array
    for (const user_id of user_ids) {
        userPossessingTickets.push(await getTicketsCreatedByUser(user_id))
    }

    const otherTickets = await prisma.ticket.findMany({
        where: {
            OR: [
                {
                    reference: query.reference_number?.trim() === '' ? undefined : query.reference_number
                }
            ]
        }
    }).catch(
        (err) => {
            console.log(err)
            return []
        })

    // extract the tickets from the 2D array
    let resultTickets = []
    for (const userTickets of userPossessingTickets) {
        for (const ticket of userTickets) {
            resultTickets.push(ticket)
        }
    }

    // add the other tickets
    for (const ticket of otherTickets) {
        resultTickets.push(ticket)
    }

    // remove duplicates
    resultTickets = resultTickets.filter((ticket, index, self) =>
            index === self.findIndex((t) => (
                t.id === ticket.id
            ))
    )

    // if count is 0, adjust strictness for reference number if it is not empty
    if (resultTickets.length === 0 && query.reference_number?.trim() !== '') {
        resultTickets = await prisma.ticket.findMany({
            where: {
                reference: {
                    contains: query.reference_number?.trim() === '' ? undefined : query.reference_number
                }
            }
        }).catch(
            (err) => {
                console.log(err)
                return []
            })
    }

    return resultTickets
}


export async function deleteTicketById(id: string | number) {
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

export async function randomRapidSearch(keyword: string) {
    return await prisma.ticket.findMany({
        where: {
            OR: [
                {
                    reference: {
                        contains: keyword
                    }
                }
            ]
        }
    }).catch(
        error => {
            console.log(error)
            return []
        }
    )
}
