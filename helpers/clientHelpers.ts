import { STATUS, type UserChatObject } from "~/types";
import type { Attachment, Comment, Message, Notification, Ticket } from "@prisma/client";
import { type Ref } from "vue";


export async function updateNotifications(State: any, user_id: string) {
    const res = await $fetch('/api/notifications', {
        headers: {
            "Authorization": `User ${user_id}`
        }
    })

    if (res?.statusCode === 200) {
        State.value = res.body
    }
}

export function onNewTicketCallback(ticket: Ticket, newTicketsState: Ref<Ticket[] | null>) {
    if (!newTicketsState.value?.find((t: Ticket) => t.id === ticket.id)) {
        newTicketsState.value?.unshift(ticket)
    }
}

export function onUpdateTicketCallback(ticket: Ticket, newTicketsState: Ref<Ticket[] | null>) {
    const ticketIndexNew = newTicketsState.value?.findIndex((t: Ticket) => t.id === ticket.id)

    if (ticketIndexNew === -1 || ticketIndexNew === undefined) {
        console.log('Ticket not found in new tickets state, ticket is not new')
        // TODO: Re-fetch tickets from server
        return
    }

    if (ticket.status !== STATUS.O) {
        newTicketsState.value!.splice(ticketIndexNew, 1)
    } else {
        newTicketsState.value![ticketIndexNew] = ticket
    }
}

export function onDeleteTicketCallback(ticket: Ticket, newTicketsState: Ref<Ticket[] | null>) {
    const ticketId = ticket.id
    const ticketIndexDel = newTicketsState.value?.findIndex((t: Ticket) => t.id === ticketId) || null

    if (!(ticketIndexDel !== -1 && ticketIndexDel !== null)) return
    newTicketsState.value?.splice(ticketIndexDel, 1)
}

export function onNewComment(comment: Comment, affect: Ref<Comment[]>) {
    if (comment?.ticketId === affect.value[0].ticketId && !affect.value.find((c: Comment) => c.id === comment.id)) {
        affect.value.unshift(comment)
    }
}

export function onDeleteComment(comment: Comment & { ticket: Ticket }, affect: Ref<Comment[]>) {
    const commentIndex = affect.value.findIndex((c: Comment) => c.id === comment.id)

    if (commentIndex !== -1) {
        affect.value.splice(commentIndex, 1)
    }
}

export function onNotificationCallback(notification: Notification, notificationsState: Ref<Notification[] | null>) {
    if (notificationsState && !notificationsState.value?.find((n: Notification) => n.id === notification.id)) {
        notificationsState.value?.unshift(notification)
    }
}

export function onMessageCallback(
    message: Message &
    { attachments: Attachment[] } &
    { chat_id: string },
    chatsState: Ref<UserChatObject[]>, onNoChat: Function) {
    try {
        let chat = chatsState.value.find((chat: UserChatObject) => chat.chat_id === message?.chat_id) || null

        if (!chat) {
            onNoChat()
            return
        }

        if (!chat.Message.find((_message: any) => _message.id === message.id)) {
            chat.Message.push(message)
        } else {
            console.log('message already exists')
        }

        return chat
    } catch (e) {
        console.warn(e)
        return null
    }
}