import {
    MessageTemplate,
    CannedResponseMessages,
    HttpResponseType,
    HttpResponseTemplate, Payload
} from "~/types";
import { getOrCreateChat, createMessage, getUser } from "~/helpers/dbHelpers"
import {socketSendMessage} from "~/helpers/socketHelpers";

export default defineEventHandler(async (event) => {
    const message_object = await readBody(event) as MessageTemplate;

    if (!message_object.message_to || !message_object.user_id || !message_object.message_body || !message_object.chat_id || message_object.chat_id === "") {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.INVALID_JSON
        } as HttpResponseTemplate
    }

    const [receiver, user] = await Promise.all([getUser(message_object.message_to), getUser(message_object.user_id)]);
    if (!user.user || !receiver.user) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.USER_NOT_FOUND
        } as HttpResponseTemplate
    }

    const chat = await getOrCreateChat(message_object)
    const message = await createMessage(message_object)

    if (!chat || !message) {
        return {
            statusCode: 400,
            type: HttpResponseType.ERROR,
            body: CannedResponseMessages.CANT_CREATE_MESSAGE
        } as HttpResponseTemplate
    }

    let senderNotificationMessage = `${CannedResponseMessages.MESSAGE_SENT} to ${receiver.user.user_id}`
    let receiverNotificationMessage = `${CannedResponseMessages.MESSAGE_RECEIVED} from ${user.user.user_id}`

    // do not await these functions, they may take long and we don't want to block the user
    socketSendMessage(message, message_object.user_id, senderNotificationMessage)
    socketSendMessage(message, message_object.message_to, receiverNotificationMessage)

    return {
        statusCode: 200,
        type: HttpResponseType.SUCCESS,
        body: {
            data: message
        } as Payload
    } as HttpResponseTemplate
})