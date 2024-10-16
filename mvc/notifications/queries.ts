import type { Notification } from "@prisma/client";
import prisma from "~/db";

export function markNotificationAsRead(id: string | number) {
    return prisma.notification.update({
        where: {
            id: Number(id)
        },
        data: {
            opened: true
        }
    })
}

export async function getAllUnreadNotifications(user_id: string) {
    return await prisma.notification.findMany({
        where: {
            for_user_id: user_id.toString(),
            opened: false
        }
    }).catch(
        (error: any) => {
            console.log(error)
            return []
        }
    )
}


export async function createNotification(notification: { message: string; for_user_id: string, type: string }) {
    return await prisma.notification.create({
        data: notification
    })
}