import prisma from "~/helpers/script";
import {
    Action,
    Actor,
    CannedResponseMessages, CommentAct,
    HttpResponseTemplate,
    HttpResponseType,
    Payload,
    SocketResponseTemplate,
    SocketResponseType
} from "~/types";
import {notifyAllConnectedClients} from "~/helpers/socketHelpers";

export default defineEventHandler(async (event) => {
    const {commentId} = await readBody(event)

    if (!commentId) {
        return {
            statusCode: 400,
            body: CannedResponseMessages.NO_ID_PROVIDED
        }
    }

    // check for child comments
    const childComments = await prisma.comment.findMany({
        where: {
            parent: {
                id: parseInt(commentId)
            }
        }
    })

    if (childComments.length > 0) {
        for (const childComment of childComments) {
            await prisma.comment.delete({
                where: {
                    id: childComment.id
                }
            })
        }
    }

    // delete comment
    let comment = await prisma.comment.delete({
        where: {
            id: parseInt(commentId)
        }
    })

    // send action to all connected clients
    if (comment) {
        const response = {
            statusCode: 200,
            type: SocketResponseType.ACTION,
            body: {
                actor: Actor.COMMENT,
                payload: {
                    data: {
                        action: CommentAct.DELETE,
                        ticket: await prisma.ticket.findUnique({
                            where: {
                                id: comment?.ticketId
                            }
                        }),
                        commentId: commentId
                    }
                } as Payload
            } as Action
        } as SocketResponseTemplate

        // do not await, due to blocking, as this may take a while
        notifyAllConnectedClients(response)

        return {
            statusCode: 200,
            type: HttpResponseType.SUCCESS,
            body: {
                data: comment
            } as Payload
        } as HttpResponseTemplate
    }

    return {
        statusCode: 400,
        type: HttpResponseType.ERROR,
        body: CannedResponseMessages.REQUEST_FAILED
    } as HttpResponseTemplate
})