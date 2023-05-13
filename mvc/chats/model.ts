import {H3Event} from "h3";
import {HttpResponseTemplate, SocketTemplate, TYPE} from "~/types";
import {createMessage, getOrCreateChat, getUserChats, readUserMessage} from "~/mvc/chats/queries";
import {createAndShuttleNotification, shuttleData} from "~/mvc/utils";
import {getUserName} from "~/mvc/user/queries";

export async function getChats(event: H3Event) {
    const user_id = await readBody(event) || null;
    let response = {} as HttpResponseTemplate

    if (!user_id) {
        response.statusCode = 400
        response.body = "No user provided"
        return response
    }

    response.statusCode = 200
    response.body = await getUserChats(user_id)

    return response
}

export async function sendMessage(event: H3Event) {
    const {chat_id, from_user_id, to_user_id, message} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if (!chat_id || !from_user_id || !to_user_id || !message) {
        response.statusCode = 400
        response.body = "Missing parameters"
        return response
    }

    const chat = await getOrCreateChat(from_user_id, to_user_id)
    if (!chat) {
        response.statusCode = 500
        response.body = "Error creating chat"
        return response
    }

    const createdMessage = await createMessage(chat?.chat_id, from_user_id, to_user_id, message)
    if (!createdMessage) {
        response.statusCode = 500
        response.body = "Error creating message"
        return response
    }

    let socketResponse = {} as SocketTemplate
    socketResponse.statusCode = 200
    socketResponse.type = TYPE.MESSAGE
    socketResponse.body = {
        message: createdMessage,
        fromUserName: await getUserName(from_user_id)
    }

    shuttleData(to_user_id, socketResponse)
    shuttleData(from_user_id, socketResponse)

    // createAndShuttleNotification(to_user_id, `You have a new message from ${socketResponse.body.fromUserName}`, TYPE.NEW_MESSAGE_NOTIFICATION)

    response.statusCode = 200
    response.body = createdMessage
    return response
}

export async function readMessage(event: H3Event){
    const {chat_id, user_id} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if(!chat_id || !user_id){
        response.statusCode = 401
        response.body = "Missing Parameters"
        return response
    }

    await readUserMessage(user_id, chat_id)

    response.statusCode = 200
    response.body = "Messages marked as read"

    return response
}