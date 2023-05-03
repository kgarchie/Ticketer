import {WebSocket} from "ws";
import {
    Client,
    NOTIFICATION_TYPE,
    Payload,
    SocketResponseTemplate,
    SocketResponseType
} from "~/types";
import {Message} from "@prisma/client";
import {createNotification} from "~/helpers/dbHelpers";
import prisma from "~/helpers/script";

export async function socketSendMessage(message: Message, user_id: string, notificationMessage: string) {
    const recipients = global.clients.filter((c) => c.user_id?.toString() === user_id)
    let notification: Notification | undefined

    if (!(recipients.length > 0)) {
        notification = await createNotification(user_id, notificationMessage, NOTIFICATION_TYPE.N, false) as Notification | undefined
    } else {
        notification = await createNotification(user_id, notificationMessage, NOTIFICATION_TYPE.N, true) as Notification | undefined
    }

    recipients.forEach((recipient) => {
        socketSendNotification(recipient, notification)

        const response = JSON.stringify({
            statusCode: 200,
            type: SocketResponseType.MESSAGE,
            body: {
                data: message,
            } as Payload
        } as SocketResponseTemplate);

        socketSendData(recipient.Socket, response)
    });
}

function socketSendNotification(client: Client, notification: Notification | undefined) {
    const response = JSON.stringify({
        statusCode: 200,
        type: SocketResponseType.NOTIFICATION,
        body: {
            data: notification ?? {}
        } as Payload
    } as SocketResponseTemplate)

    socketSendData(client.Socket, response)
}

export function promptDetails(client: Client | null) {
    if (!client?.user_id && client?.Socket) {
        const response = JSON.stringify({
            statusCode: 200,
            type: SocketResponseType.DETAILS_REQ
        } as SocketResponseTemplate)
        socketSendData(client.Socket, response)
    } else {
        console.log("No client or socket provided")
    }
}

export async function socketSendData(ws: WebSocket, message: string, maxRetries = 5) {
    setTimeout(() => {
        ws.send(message, (err: any) => {
            if (err) {
                if (maxRetries > 0) {
                    console.log("Retrying to send message")
                    socketSendData(ws, message, maxRetries - 1)
                } else {
                    console.log("Could not send message, removing client and closing socket...")
                    ws.close()
                    let local_clients = global.clients
                    if (local_clients?.length > 0) {
                        local_clients = local_clients.filter((c) => c.Socket !== ws)
                        global.clients = local_clients
                    }
                }
            }
        })
    }, 0);
}


export async function notifyAllConnectedClients(response: SocketResponseTemplate) {
    global.clients.forEach((client) => {
        socketSendData(client.Socket, JSON.stringify(response))
    })
}


async function getUserName(user_id: string | null) {
    const user = await prisma.user.findUnique({
        where: {
            user_id: user_id || undefined
        }
    })

    if (user) {
        return user.name
    } else {
        return "Unregistered User"
    }
}

export async function notifyAllAndConnectedAdmins(response: SocketResponseTemplate, sender_id: string | null) {
    const admins = await prisma.user.findMany({
        where: {
            is_admin: true
        }
    })

    if (admins.length > 0) {
        for (const admin of admins) {
            const adminSocket = global.clients.find((client) => client.user_id === admin.user_id)

            if (adminSocket) {
                let notification = await prisma.notification.create({
                    data: {
                        for_user_id: admin.user_id,
                        message: `New ticket created by ${await getUserName(sender_id)}`,
                        type: NOTIFICATION_TYPE.T
                    }
                })

                const response = {
                    statusCode: 200,
                    type: SocketResponseType.NOTIFICATION,
                    body: {
                        data: notification
                    } as Payload
                } as SocketResponseTemplate

                socketSendData(adminSocket.Socket, JSON.stringify(response))
            }
        }
    }
}