import { PASSWORD_RESET_TEMPLATE, type SocketTemplate, TYPE } from "~/types";
import nodemailer from "nodemailer";
import { Client } from "~/server/utils/socket";
import prisma from "~/db";
import { getAdmins, getUserName } from "~/mvc/user/queries";
import { createNotification } from "./notifications/functions";

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


export async function createAndShuttleNotification(user_id: string, message: string, type?: TYPE) {
    return createNotification(user_id, message, type)
}

export async function getConnectedClientSockets(user_id: string) {
    return global.channels?.get(user_id)?.clients || []
}

export async function notifyAllAndConnectedAdmins(response: SocketTemplate, sender_id: string) {
    const admins = await getAdmins()

    for (const admin of admins) {
        createAndShuttleNotification(admin.user_id, `New ticket created by ${await getUserName(sender_id)}`, TYPE.NEW_TICKET)
    }
}

export async function shuttleDataToAllClients(response: SocketTemplate) {
    global.clients?.broadcast(response)
}

export async function socketSendData(client: Client, message: any, maxRetries = 5) {
    setTimeout(() => {
        client.send(message)
    }, 0);
}

export async function shuttleData(user_id: string, data: SocketTemplate) {
    global.channels?.publish(user_id, data) || console.log("No channel found for user", user_id)
}