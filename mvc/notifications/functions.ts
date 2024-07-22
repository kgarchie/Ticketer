import {H3Event} from "h3";
import {TYPE, type HttpResponseTemplate} from "~/types";
import {getAuthCookie} from "~/mvc/auth/helpers";
import {getAllUnreadNotifications, markNotificationAsRead,createNotification as _createNotification} from "~/mvc/notifications/queries";
import { shuttleData } from "../utils";

export async function readNotification(event:H3Event){
    const id = event.context.params?.id
    const {user_id} = await getAuthCookie(event)
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
    const user_id = readAuthToken(event, "User")
    let response = {} as HttpResponseTemplate

    if(!user_id || user_id === "" || user_id === undefined){
        response.statusCode = 401
        response.body = "Botched Request"
        return response
    }

    const notifications = await getAllUnreadNotifications(user_id)
    response.statusCode = 200
    response.body = notifications

    return response
}


export async function createNotification(_for: string, message: string, type?: TYPE){
    const notification = await _createNotification({
        message: message,
        for_user_id: _for,
        type: (type || TYPE.NOTIFICATION) as string,
    }).catch(console.error)

    shuttleData(_for, {
        statusCode: 200,
        type: type || TYPE.NOTIFICATION,
        body: notification
    })

    return notification
}