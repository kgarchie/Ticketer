import {PASSWORD_RESET_TEMPLATE, SocketTemplate, TYPE} from "~/types";
import {WebSocket} from "ws";
import nodemailer from "nodemailer";
import prisma from "~/db";
import {getAdmins, getUserName} from "~/mvc/user/queries";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

export async function sendMail(mailDetails: any) {
    try {
        return await transporter.sendMail(mailDetails);
    } catch (e) {
        console.log(e);
        return e;
    }
}

export async function mailResetPasswordLink(email: string, origin: string, token: string, user_id: string) {
    const link = `${origin}/auth/identity/reset/${user_id}&${email}&${token}`;

    const message = "Click the link below to reset your password\n\n" + link;
    const options = {
        to: email,
        subject: "Reset your password",
        text: message,
        html: PASSWORD_RESET_TEMPLATE(link)
    }

    console.log(message)

    return await sendMail(options)
}


export async function createAndShuttleNotification(user_id: string, message: string, type: TYPE) {
    const notification = await prisma.notification.create({
        data: {
            for_user_id: user_id,
            message: message,
            type: type
        }
    })

    const response = {} as SocketTemplate
    response.statusCode = 200
    response.type = type
    response.body = notification

    shuttleData(user_id, response)
}

export function getConnectedClientSockets(user_id: string) {
    return global.clients.filter((client) => {
        return client.user_id === user_id
    })
}

export async function notifyAllAndConnectedAdmins(response: SocketTemplate, sender_id: string) {
    const admins = await getAdmins()

    for (const admin of admins) {
        createAndShuttleNotification(admin.user_id, `New ticket created by ${await getUserName(sender_id)}`, TYPE.TICKET)
    }
}

export async function shuttleDataToAllClients(response: SocketTemplate) {
    for (const client of global.clients) {
        socketSendData(client.Socket, JSON.stringify(response))
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

export function shuttleData(user_id: string, data: SocketTemplate) {
    const sockets = getConnectedClientSockets(user_id)

    for (const socket of sockets) {
        socketSendData(socket.Socket, JSON.stringify(data))
    }
}