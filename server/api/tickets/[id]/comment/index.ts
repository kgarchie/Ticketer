import prisma from "~/helpers/script";
import {
    Action,
    Actor,
    CannedResponseMessages,
    CommentAct,
    HttpResponseTemplate,
    HttpResponseType,
    Payload,
    SocketResponseTemplate,
    SocketResponseType
} from "~/types";
import {notifyAllConnectedClients} from "~/helpers/socketHelpers";

export default defineEventHandler(async (event) => {
        const ticketId = event.context.params?.id as string | null;

        if (!ticketId) {
            return {
                statusCode: 400,
                type: HttpResponseType.ERROR,
                body: CannedResponseMessages.NO_ID_PROVIDED
            } as HttpResponseTemplate
        }

        // get data from post body
        const {comment, commentor, parentId} = await readBody(event)

        let newComment: any = null

        // if comment has no parent, it is a root comment
        if (!parentId) {
            newComment = await prisma.comment.create({
                data: {
                    comment: comment,
                    ticket: {
                        connect: {
                            id: parseInt(ticketId)
                        }
                    },
                    commentor: commentor
                }
            }).then(comment => {
                if (comment) {
                    return comment
                } else {
                    return null
                }
            }).catch(err => {
                console.log(err);
                return null
            })
        } else {
            // if comment has a parent, it is a child comment
            newComment = await prisma.comment.create({
                data: {
                    comment: comment,
                    ticket: {
                        connect: {
                            id: parseInt(ticketId)
                        }
                    },
                    commentor: commentor,
                    parent: {
                        connect: {
                            id: parseInt(parentId)
                        }
                    }
                }
            }).then(comment => {
                if (comment) {
                    return comment
                } else {
                    return null
                }
            }).catch(err => {
                console.log(err);
                return null
            })
        }


        // notify connected clients
        if (newComment) {
            const response = {
                statusCode: 200,
                type: SocketResponseType.ACTION,
                body: {
                    actor: Actor.COMMENT,
                    payload: {
                        data: {
                            action: CommentAct.CREATE,
                            comment: newComment,
                            ticket: await prisma.ticket.findUnique({
                                where: {
                                    id: parseInt(ticketId)
                                }
                            })
                        }
                    } as Payload
                } as Action
            } as SocketResponseTemplate

            notifyAllConnectedClients(response)

            return {
                statusCode: 200,
                type: HttpResponseType.SUCCESS,
                body: {
                    data: newComment
                } as Payload
            } as HttpResponseTemplate
        }


        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.REQUEST_FAILED
        } as HttpResponseTemplate
    }
)