import prisma from "~/db";

export function markNotificationAsRead(id:string | number){
    return prisma.notification.update({
        where:{
            id: Number(id)
        },
        data:{
            opened: true
        }
    })
}

export function getAllUnreadNotifications(user_id:string){
    return prisma.notification.findMany({
        where:{
            for_user_id: user_id,
            opened: false
        }
    })
}