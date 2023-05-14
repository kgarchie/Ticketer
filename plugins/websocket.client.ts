import {Comment, Message, Notification, Ticket} from "@prisma/client";
import {
    CommentOperation,
    SocketStatus,
    SocketTemplate,
    STATUS,
    TicketOperation,
    TYPE,
    websocketPort
} from "~/types";
import {updateTicketsMetaData} from "~/helpers/clientHelpers";

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"

// For Development
// const socket_url = `${wsProtocol}//${window.location.hostname}:${websocketPort}`

// For Production
const socket_url: string = `${wsProtocol}//${window.location.host}`

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
        detailsSent: boolean = false

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
                    type: TYPE.DETAILS_RES,
                    body: user.user_id
                } as SocketTemplate)

                await this.socketSendData(this.webSocket, response)
            }

            this.detailsSent = true
            console.log('Details sent for user: ' + user.user_id)
        }

        public sendHeartbeat() {
            const response = JSON.stringify({
                statusCode: 200,
                type: TYPE.HEARTBEAT
            } as SocketTemplate)

            this.socketSendData(this.webSocket, response)
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

                const SocketResponse = JSON.parse(event.data) as SocketTemplate
                // console.log("Received Message", SocketResponse)
                switch (SocketResponse.type) {
                    case TYPE.HEARTBEAT:
                        this.sendHeartbeat()
                        console.log('Heartbeat received and sent')
                        break;
                    case TYPE.DETAILS_REQ:
                        if (!this.detailsSent) {
                            this.sendDetails()
                        }
                        // flip back the switch
                        this.detailsSent = false
                        break;
                    case TYPE.NOTIFICATION:
                        const notification = SocketResponse.body as Notification
                        // if notification does not exist in notifications state, add it
                        if (!notificationsState.value.find((n: Notification) => n.id === notification.id)) {
                            notificationsState.value.unshift(notification)
                        }

                        if ('serviceWorker' in navigator) {
                            if (window.Notification.permission === 'granted') {
                                navigator.serviceWorker.getRegistration().then(reg => {
                                    reg?.showNotification("Notification", {
                                        body: notification.message,
                                        icon: '/favicon.ico',
                                    })
                                })
                            } else {
                                // make a sound
                                const audio = new Audio('/notification.mp3')
                                audio.play()
                            }
                        } else {
                            alert("Your browser doesn't support notifications. Please use a modern browser")
                        }

                        break;
                    case TYPE.MESSAGE:
                        const message = SocketResponse.body.message as Message
                        const fromUserName = SocketResponse.body.fromUserName as string
                        // console.log('User message received', message)
                        newMessageState.value = message
                        // console.log('New message state', useNewMessageState.value)
                        // check if tab is open
                        if (document.visibilityState !== 'visible') {
                            if (window.Notification.permission === 'granted') {
                                navigator.serviceWorker.getRegistration().then(reg => {
                                    reg?.showNotification(fromUserName, {
                                        body: message.message,
                                        icon: '/favicon.ico',
                                    })
                                })
                            }

                            const audio = new Audio('/notification.mp3')
                            audio.play()
                        }
                        // console.log(message)
                        break;
                    case TYPE.NEW_TICKET:
                        const new_ticket = SocketResponse.body as Ticket

                        // if ticket is not in new tickets state, add it
                        if (!newTicketsState.value.find((t: Ticket) => t.id === new_ticket.id)) {
                            newTicketsState.value.unshift(new_ticket)
                        }

                        updateTicketsMetaData(TicketsMetaDataState.value)
                        console.log('New ticket added')
                        break;
                    case TYPE.UPDATE_TICKET:
                        const ticket = SocketResponse.body as Ticket

                        // find ticket in new tickets state, update it
                        const ticketIndexNew = newTicketsState.value.findIndex((t: Ticket) => t.id === ticket.id)
                        if (ticketIndexNew !== -1) {
                            if(ticket.status !== STATUS.O) {
                                newTicketsState.value.splice(ticketIndexNew, 1)
                            } else {
                                newTicketsState.value[ticketIndexNew] = ticket
                            }
                        } else {
                            console.log('Ticket not found in new tickets state, ticket is not new')
                        }

                        updateTicketsMetaData(TicketsMetaDataState.value)
                        // console.log('Ticket action received', ticket, action)
                        break;
                    case TYPE.DELETE_TICKET:
                        const ticketId = SocketResponse.body as number
                        // console.log('Ticket action received', "Delete", ticketId)
                        // find ticket in new tickets state, delete it
                        const ticketIndexDel = newTicketsState.value.findIndex((t: Ticket) => t.id === ticketId)
                        // console.log('Ticket index', ticketIndexDel)
                        if (ticketIndexDel !== -1) {
                            newTicketsState.value.splice(ticketIndexDel, 1)
                        }
                        useTicketActions().value = ({
                            action: TicketOperation.DELETE,
                            ticketId: ticketId
                        })
                        updateTicketsMetaData(TicketsMetaDataState.value)
                        break;

                    case TYPE.NEW_COMMENT:
                        let newComment = SocketResponse.body as Comment
                        // console.log('New comment received', newComment)
                        newTicketCommentState.value = newComment
                        break;
                    case TYPE.DELETE_COMMENT:
                        let comment = SocketResponse.body as Comment & { ticket: Ticket }
                        // console.log('Comment action received', "Delete", comment)
                        commentActionsState.value = ({
                            action: CommentOperation.DELETE,
                            ticket: comment.ticket,
                            commentId: comment.id
                        })
                        break;
                    case TYPE.STATUS:
                        console.log('Server status received')
                        useWsServerStatus().value = SocketStatus.OPEN
                        break;
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
        private maxRetries = 10

        public async pollWsStatus() {
            if(this.maxRetries-- > 0) {
                console.log('Polling socket server status')
                if (WsServerStatusState.value !== SocketStatus.OPEN && this.webSocket.readyState === WebSocket.OPEN) {
                    WsServerStatusState.value = SocketStatus.OPEN
                } else if (WsServerStatusState.value !== SocketStatus.CLOSED && this.webSocket.readyState === WebSocket.CLOSED) {
                    WsServerStatusState.value = SocketStatus.CLOSED
                } else if (this.webSocket.readyState === WebSocket.CLOSED) {
                    try {
                        this.webSocket = new WebSocket(socket_url)
                        this.setUpSocket()
                        await new Promise(resolve => setTimeout(resolve, 3000))
                    } catch (e) {
                        console.log(e)
                    }
                }

                if (WsServerStatusState.value !== SocketStatus.OPEN) {
                    setTimeout(() => {
                        this.pollWsStatus()
                    }, 3000)

                    await new Promise(resolve => setTimeout(resolve, 5000))
                }

                this.maxRetries -= 1
            }
            return
        }

        constructor() {
            this.webSocket = new WebSocket(socket_url)
            this.setUpSocket()
        }
    }


    return {
        provide: {
            ClientWebSocket: ClientWebSocket
        }
    }
})
