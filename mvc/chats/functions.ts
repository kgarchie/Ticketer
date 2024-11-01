import {H3Event} from "h3";
import {readFiles} from 'h3-formidable'
import {type HttpResponseTemplate, type sdpCall, type SocketTemplate, TYPE} from "~/types";
import {
    createMessage, deleteMessage,
    getMessageById,
    getOrCreateChat,
    getUserChats,
    readUserMessage,
    storeFiles
} from "~/mvc/chats/queries";
import {createAndShuttleNotification, getConnectedClientSockets, shuttleData} from "~/mvc/utils";
import {getUserName} from "~/mvc/user/queries";
import filestorage from "~/filestorage";

export async function getChats(event: H3Event) {
    const user_id = readAuthToken(event, "User")
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
    const {fields, files} = await readFiles(event, {
        includeFields: true
    })

    const chat_id = fields?.chat_id.at(-1)
    const from_user_id = fields?.from_user_id.at(-1)
    const to_user_id = fields?.to_user_id.at(-1)
    const message = fields?.message.at(-1)
    const companyName = fields?.companyName.at(-1)

    let response = {} as HttpResponseTemplate

    if (!chat_id || !from_user_id || !to_user_id || (!message && (!files || files.length === 0))) {
        response.statusCode = 400
        response.body = "Missing parameters"
        return response
    }

    const chat = await getOrCreateChat(from_user_id, to_user_id, {name: companyName})
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

    if (files.files?.length) {
        try {
            await storeFiles(files.files, createdMessage.id, chat.chat_id, from_user_id)
        } catch (e) {
            await deleteMessage(createdMessage.id)
            response.statusCode = 500
            // @ts-ignore
            response.body = e?.message || "Error storing files"
            return response
        }
    }


    let socketResponse = {} as SocketTemplate

    socketResponse.statusCode = 200
    socketResponse.type = TYPE.MESSAGE

    socketResponse.body = {
        message: await getMessageById(createdMessage.id),
        chat_id: chat.chat_id,
        fromUserName: await getUserName(from_user_id)
    }

    shuttleData(to_user_id, socketResponse)
    shuttleData(from_user_id, socketResponse)
    createAndShuttleNotification(to_user_id, `You have a new message from ${socketResponse.body.fromUserName}`, TYPE.NEW_MESSAGE_NOTIFICATION)

    response.statusCode = 200
    response.body = createdMessage
    return response
}

export async function readMessage(event: H3Event) {
    const {chat_id, user_id} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if (!chat_id || !user_id) {
        response.statusCode = 401
        response.body = "Missing Parameters"
        return response
    }

    await readUserMessage(user_id, chat_id)

    response.statusCode = 200
    response.body = "Messages marked as read"

    return response
}


export async function placeCall(event: H3Event) {
    const {user_id, chat_id, to_user_id, sdp} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if (!chat_id || !to_user_id || !user_id || !sdp) {
        response.statusCode = 401
        response.body = "Missing Parameters"
        return response
    }

    let socketResponse = {} as SocketTemplate
    socketResponse.statusCode = 200
    socketResponse.type = TYPE.CALL

    socketResponse.body = {
        chat_id: chat_id,
        caller_user_id: user_id,
        callee_user_id: to_user_id,
        sdp: sdp
    } as sdpCall

    const onlineDevices = await getConnectedClientSockets(to_user_id)

    if (onlineDevices?.length === 0) {
        response.statusCode = 204
        response.body = "User is offline"
        return response
    }

    shuttleData(to_user_id, socketResponse)

    response.statusCode = 200
    response.body = "Call placed"

    return response
}

export async function acceptCall(event: H3Event) {
    const {callee_user_id, caller_user_id, chat_id, sdp} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if (!callee_user_id || !caller_user_id || !chat_id || !sdp) {
        response.statusCode = 401
        response.body = "Missing Parameters"
        return response
    }

    await shuttleData(caller_user_id, {
        statusCode: 200,
        type: TYPE.CALL_SDP,
        body: {
            chat_id: chat_id,
            caller_user_id: caller_user_id,
            callee_user_id: callee_user_id,
            sdp: sdp
        } as sdpCall
    })

    response.statusCode = 200
    response.body = "Call accepted"

    return response
}

export async function rejectCall(event: H3Event) {
    const {user_id} = await readBody(event)
    let response = {} as HttpResponseTemplate

    if (!user_id) {
        response.statusCode = 401
        response.body = "Missing Parameters"
        return response
    }

    response.statusCode = 229
    response.body = "Call rejected"

    return response
}