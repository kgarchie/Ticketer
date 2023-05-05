import {Comment, Message, Notification, Ticket} from "@prisma/client";
import {
    Action,
    Actor,
    CommentAct,
    NOTIFICATION_TYPE,
    Payload,
    SocketResponseTemplate,
    SocketResponseType,
    SocketStatus
} from "~/types";
import {updateTicketsMetaData} from "~/helpers/frontEndHelpers";

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"

// For Development
const domain = window.location.hostname
// const socket_url = `${wsProtocol}//${domain}:${websocketPort}`

// For Production
const socket_url:string = `${wsProtocol}//${window.location.host}`

export default defineNuxtPlugin(() => {
    const newMessageState = useNewMessage()
    const notificationsState = useNotifications()
    const newTicketsState = useNewTickets()
    const WsServerStatusState = useWsServerStatus()
    const TicketsMetaDataState = useTicketsMetaData()
    const newTicketCommentState = useNewTicketComment()
    const commentActionsState = useCommentActions()

    class ClientWebSocket {
        webSocket: WebSocket

        private async sendDetails() {
            const user = useUser().value

            // if there is no user, wait for the user to be fetched
            if (!user.user_id || user.user_id === '') {
                setTimeout(() => {
                    this.sendDetails()
                    console.log('Retrying to send details | User not found')
                }, 1000)
                return
            } else {
                const response = JSON.stringify({
                    statusCode: 200,
                    type: SocketResponseType.DETAILS_RES,
                    body: user.user_id
                } as SocketResponseTemplate)

                await this.socketSendData(this.webSocket, response)
            }

            console.log('Details sent for user: ' + user.user_id)
        }

        private socketSendData(WebSocket: WebSocket, response: string, maxRetries = 5) {
            try {
                WebSocket.send(response)
            } catch (e) {
                console.log('Retrying to send message')
                if (maxRetries > 0) {
                    setTimeout(() => {
                        this.socketSendData(WebSocket, response, maxRetries - 1)
                    }, 500)
                } else {
                    console.log('Max retries reached')
                    WsServerStatusState.value = SocketStatus.CLOSED
                }
            }
        }

        setUpSocket() {
            this.webSocket = new WebSocket(socket_url)

            this.webSocket.onopen = () => {
                console.log('Socket opened')
                // send details on first connection
                this.sendDetails() // redundant sometimes but important if the server fails to request details
                console.log('Message sent')
            }

            this.webSocket.onmessage = (event: MessageEvent) => {
                if (WsServerStatusState.value !== SocketStatus.OPEN) {
                    WsServerStatusState.value = SocketStatus.OPEN
                }
                let payload: Payload
                const SocketResponse = JSON.parse(event.data) as SocketResponseTemplate
                // console.log("Received Message", SocketResponse)
                switch (SocketResponse.type) {
                    case SocketResponseType.HEARTBEAT:
                        const response = JSON.stringify(
                            {
                                statusCode: 200,
                                type: SocketResponseType.HEARTBEAT
                            } as SocketResponseTemplate
                        )
                        this.socketSendData(this.webSocket, response)
                        console.log('Heartbeat received and sent')
                        break;
                    case SocketResponseType.DETAILS_REQ:
                        this.sendDetails()
                        break;
                    case SocketResponseType.NOTIFICATION:
                        payload = SocketResponse.body as Payload
                        const notification = payload.data as Notification

                        // if notification does not exist in notifications state, add it
                        if (!notificationsState.value.find((n: Notification) => n.id === notification.id)) {
                            notificationsState.value.unshift(notification)
                        }
                        // console.log('Notification received', notification)

                        if (notification.type === NOTIFICATION_TYPE.T) {
                            if ('serviceWorker' in navigator) {
                                if (Notification.permission === 'granted') {
                                    navigator.serviceWorker.getRegistration().then(reg => {
                                        reg?.showNotification(notification.message, {
                                            body: notification.message,
                                            icon: '/favicon.ico',
                                        })
                                    })
                                } else {
                                    alert(notification.message)
                                }
                            } else {
                                alert("Browser does not support notifications")
                            }
                        }
                        break;
                    case SocketResponseType.MESSAGE:
                        payload = SocketResponse.body as Payload
                        const message = payload.data as Message

                        // console.log('User message received', message)

                        newMessageState.value = message

                        // console.log('New message state', useNewMessageState.value)
                        // check if tab is open
                        if (document.visibilityState !== 'visible') {
                            if (Notification.permission === 'granted') {
                                navigator.serviceWorker.getRegistration().then(reg => {
                                    reg?.showNotification(message.from_user_id?.toString().split('').splice(0, 6).join('') || 'New message', {
                                        body: message.message || 'New message',
                                        icon: '/favicon.ico',
                                    })
                                })
                            }
                        }
                        // console.log(message)
                        break;
                    case SocketResponseType.TICKET:
                        payload = SocketResponse.body as Payload
                        const new_ticket = payload.data as Ticket

                        // if ticket is not in new tickets state, add it
                        if (!newTicketsState.value.find((t: Ticket) => t.id === new_ticket.id)) {
                            newTicketsState.value.unshift(new_ticket)
                        }

                        updateTicketsMetaData(TicketsMetaDataState.value)
                        console.log('New ticket added')
                        break;
                    case SocketResponseType.ACTION:
                        const action = SocketResponse.body as Action
                        const actor = action.actor

                        switch (actor) {
                            case Actor.TICKET:
                                const ticket = action.payload.data as Ticket
                                // console.log(ticket)

                                // find ticket in new tickets state, update it
                                const ticketIndex = newTicketsState.value.findIndex((t: Ticket) => t.id === ticket.id)
                                if (ticketIndex !== -1) {
                                    newTicketsState.value[ticketIndex] = ticket
                                } else {
                                    console.log('Ticket found in new tickets state')
                                }

                                updateTicketsMetaData(TicketsMetaDataState.value)
                                // console.log('Ticket action received', ticket, action)
                                break;
                            case Actor.COMMENT:
                                const info = action.payload.data
                                const act = info.action

                                if (act === CommentAct.CREATE) {
                                    // console.log('New comment received', comment)
                                    newTicketCommentState.value = action.payload.data as Comment
                                } else if (act === CommentAct.DELETE) {
                                    console.log('Comment action received', info)
                                    commentActionsState.value = ({
                                        action: info.action,
                                        ticket: info.ticket,
                                        commentId: info.commentId
                                    })
                                }
                                break;
                        }
                        break;
                    case SocketResponseType.STATUS:
                        console.log('Server status received')
                        useWsServerStatus().value = SocketStatus.OPEN
                        break;
                    case  SocketResponseType.TAGGED:
                        console.log('Tagged response received', SocketResponse)
                        break
                    default:
                        console.log('Socket Response From Server received', SocketResponse)
                        break;
                }
            }

            this.webSocket.onerror = () => {
                console.log('Socket error')
                WsServerStatusState.value = SocketStatus.CLOSED
                this.webSocket.close()
                this.pollWsStatus()
            }

            this.webSocket.onclose = () => {
                console.log('Socket closed')
                WsServerStatusState.value = SocketStatus.CLOSED
                this.webSocket.close()
                this.pollWsStatus()
            }
        }

        // long poll server status
        async pollWsStatus(maxRetries = 10) {
            console.log('Polling socket server status')

            try{
                this.socketSendData(this.webSocket, JSON.stringify({
                    statusCode: 200,
                    type: SocketResponseType.STATUS
                } as SocketResponseTemplate))
            } catch (e){
                console.log(e)

                if (WsServerStatusState.value !== SocketStatus.OPEN && this.webSocket.readyState === WebSocket.OPEN) {
                    WsServerStatusState.value = SocketStatus.OPEN
                } else if (WsServerStatusState.value !== SocketStatus.CLOSED && this.webSocket.readyState === WebSocket.CLOSED) {
                    WsServerStatusState.value = SocketStatus.CLOSED
                } else if (this.webSocket.readyState === WebSocket.CLOSED) {
                    try{
                        this.webSocket = new WebSocket(socket_url)
                        this.setUpSocket()
                        await new Promise(resolve => setTimeout(resolve, 3000))
                    } catch (e){
                        console.log(e)
                    }
                }

                if (WsServerStatusState.value === SocketStatus.CLOSED && maxRetries-- > 0) {
                    setTimeout(() => {
                        this.pollWsStatus()
                    }, 3000)

                    await new Promise(resolve => setTimeout(resolve, 5000))
                }
            }
        }

        constructor() {
            this.webSocket = new WebSocket(socket_url)
            this.setUpSocket()
        }
    }

    return {
        provide: {
            ClientWebSocket
        }
    }
})
