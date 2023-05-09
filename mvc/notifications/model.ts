import {H3Event} from "h3";
import {HttpResponseTemplate} from "~/types";
import {getAuthCookie} from "~/mvc/auth/helpers";
import {getAllUnreadNotifications, markNotificationAsRead} from "~/mvc/notifications/queries";

export async function readNotification(event:H3Event){
    const id = event.context.params?.id
    const {user_id} = getAuthCookie(event)
    let response = {} as HttpResponseTemplate

    if(!id || !user_id){
        response.statusCode = 401
        response.body = "Botched request"
        return response
    }


    await markNotificationAsRead(id)

    response.statusCode = 200
    response.body = "Notification marked as read"
    return response
}


export async function getNotifications(event:H3Event){
    const user_id = await readBody(event)
    let response = {} as HttpResponseTemplate

    if(!user_id){
        response.statusCode = 401
        response.body = "Botched Request"
    }

    const notifications = await getAllUnreadNotifications(user_id)
    response.statusCode = 200
    response.body = notifications

    return response
}