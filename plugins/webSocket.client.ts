import {Comment, Notification, Ticket} from "@prisma/client";
import {sdpCall, SocketStatus, SocketTemplate, TYPE, websocketPort} from "~/types";
import {updateTicketsMetaData} from "~/helpers/clientHelpers";

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"

// For Development
// const socket_url = `${wsProtocol}//${window.location.hostname}:${websocketPort}`

// For Production
const socket_url: string = `${wsProtocol}//${window.location.host}`

export default defineNuxtPlugin(() => {
    class ClientWebSocket {
        webSocket: WebSocket
        detailsSent: boolean = false
        WsServerStatus: SocketStatus = SocketStatus.CLOSED

        setUpSocket() {
            this.webSocket = new WebSocket(socket_url)

            this.webSocket.onopen = () => {
                this.sendDetails().then(() => {
                    console.log('Message sent')
                }) // redundant sometimes but important if the server fails to request details: FIXED
            }

            this.webSocket.onmessage = (event: MessageEvent) => {
                const SocketResponse = JSON.parse(event.data) as SocketTemplate
                if (this.WsServerStatus !== SocketStatus.OPEN) this.WsServerStatus = SocketStatus.OPEN

                switch (SocketResponse.type) {
                    case TYPE.HEARTBEAT:
                        this.onHeartBeat()
                        break;
                    case TYPE.DETAILS_REQ:
                        this.onDetailsReq()
                        break;
                    case TYPE.NOTIFICATION:
                        this.onNotification(SocketResponse)
                        break;
                    case TYPE.MESSAGE:
                        this.onMessage(SocketResponse)
                        break;
                    case TYPE.NEW_TICKET:
                    case TYPE.UPDATE_TICKET:
                    case TYPE.DELETE_TICKET:
                        this.onTicket(SocketResponse, SocketResponse.type)
                        break;
                    case TYPE.NEW_COMMENT:
                    case TYPE.DELETE_COMMENT:
                        this.onComment(SocketResponse, SocketResponse.type)
                        break;
                    case TYPE.STATUS:
                        this.WsServerStatus = SocketStatus.OPEN
                        break;
                    case TYPE.CALL:
                    case TYPE.CALL_SDP:
                        this.onCall(SocketResponse, SocketResponse.type)
                        break;
                    default:
                        console.log('Socket Response From Server received', SocketResponse)
                        break;
                }
            }

            this.webSocket.onerror = () => {
                console.log('Socket error')
                this.webSocket.close()
                this.pollWsStatus().then(() => {
                    console.log('Socket reconnected reconnect attempt complete | After Error')
                })
            }

            this.webSocket.onclose = () => {
                console.log('Socket closed')
                this.WsServerStatus = SocketStatus.CLOSED
                this.webSocket.close()
                this.pollWsStatus().then(() => {
                    console.log('Socket reconnect attempt complete | After Closed')
                })
            }
        }

        onHeartBeat = () => {
            this.sendHeartbeat()
            console.log('Heartbeat received and sent')
        }

        onDetailsReq = () => {
            if (!this.detailsSent) this.sendDetails().then(() => {
                console.log('Details sent')
            })
            this.detailsSent = false
        }

        onNotificationCallback: Function | null = null
        onNotification = (SocketResponse: SocketTemplate) => {
            const notification = SocketResponse.body as Notification

            if ('serviceWorker' in navigator) {
                if (window.Notification.permission === 'granted') {
                    navigator.serviceWorker.getRegistration()
                        .then(reg => {
                            reg?.showNotification("Notification", {
                                body: notification.message,
                                icon: '/favicon.ico',
                            })
                        })
                } else {
                    const audio = new Audio('/notification.mp3')
                    audio.play().then(() => {
                    })
                }
            } else {
                alert("Your browser doesn't support notifications. Please use a modern browser")
            }

            if (this.onNotificationCallback) {
                this.onNotificationCallback(notification)
            } else {
                console.error("Notifications state is null | Not set up")
            }
        }

        onMessageCallback: Function | null = null
        onMessage = (SocketResponse: SocketTemplate) => {
            const message = SocketResponse.body.message
            const fromUserName = SocketResponse.body.fromUserName as string
            message.chat_id = SocketResponse.body.chat_id as string

            if (document.visibilityState !== 'visible') {
                if (window.Notification.permission === 'granted') {
                    navigator.serviceWorker.getRegistration()
                        .then(reg => {
                            reg?.showNotification(fromUserName, {
                                body: message.message,
                                icon: '/favicon.ico',
                            })
                        })
                }

                const audio = new Audio('/notification.mp3')
                audio.play().then(() => {
                })
            }


            if (this.onMessageCallback) {
                this.onMessageCallback(message)
            } else {
                console.error("New message state is null | Not set up")
            }
        }

        onNewTicketCallback: Function | null = null
        onUpdateTicketCallback: Function | null = null
        onDeleteTicketCallback: Function | null = null
        onTicket = (SocketResponse: SocketTemplate, type: TYPE) => {
            const ticket = SocketResponse.body as Ticket
            switch (type) {
                case TYPE.NEW_TICKET:
                    if (!this.onNewTicketCallback) break
                    this.onNewTicketCallback(ticket)
                    break
                case TYPE.UPDATE_TICKET:
                    if (!this.onUpdateTicketCallback) break
                    this.onUpdateTicketCallback(ticket)
                    break
                case TYPE.DELETE_TICKET:
                    if (!this.onDeleteTicketCallback) break
                    this.onDeleteTicketCallback(ticket)
                    break
            }

            updateTicketsMetaData(useTicketsMetaData()).then(() => {
                console.log('Tickets meta data updated')
            })
        }

        onNewCommentCallback: Function | null = null
        onDeleteCommentCallback: Function | null = null
        onComment = (SocketResponse: SocketTemplate, type: TYPE) => {
            const comment = SocketResponse.body as Comment
            switch (type) {
                case TYPE.NEW_COMMENT:
                    if (!this.onNewCommentCallback) break
                    this.onNewCommentCallback(comment)
                    break
                case TYPE.DELETE_COMMENT:
                    if (!this.onDeleteCommentCallback) break
                    this.onDeleteCommentCallback(comment)
                    break
            }
        }

        onCallCallback: Function | null = null
        onCallSdpCallback: Function | null = null
        onCall = (SocketResponse: SocketTemplate, type: TYPE) => {
            const call = SocketResponse.body as sdpCall
            switch (type) {
                case TYPE.CALL:
                    if (!this.onCallCallback) break
                    this.onCallCallback(call)
                    break
                case TYPE.CALL_SDP:
                    if (!this.onCallSdpCallback) break
                    this.onCallSdpCallback(call)
                    break
            }
        }

        private async sendDetails() {
            const user = useUser().value

            if (!user.user_id || user.user_id === '') {
                setTimeout(() => {
                    this.sendDetails()
                    console.log('Retrying to send details | User not found')
                }, 1000)
                return
            }

            const response = JSON.stringify({
                statusCode: 200,
                type: TYPE.DETAILS_RES,
                body: user.user_id
            } as SocketTemplate)

            this.WsServerStatus = SocketStatus.OPEN
            await this.socketSendData(this.webSocket, response)

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
                    this.WsServerStatus = SocketStatus.CLOSED
                }
            }
        }

        private maxRetries = 10
        public polling = false

        public async pollWsStatus() {
            if (this.maxRetries-- <= 0) return
            this.polling = true
            console.log('Polling socket server status')

            if (this.WsServerStatus !== SocketStatus.OPEN && this.webSocket.readyState === WebSocket.OPEN) {
                this.WsServerStatus = SocketStatus.OPEN
            } else if (this.webSocket.readyState === WebSocket.CLOSED) {
                this.WsServerStatus = SocketStatus.CLOSED
                try {
                    this.setUpSocket()
                    await new Promise(resolve => setTimeout(resolve, 3000))
                } catch (e) {
                    console.error(e)
                }
            }

            this.maxRetries -= 1
            if (this.WsServerStatus === SocketStatus.OPEN) return

            setTimeout(() => {
                this.pollWsStatus()
            }, 3000)
            await new Promise(resolve => setTimeout(resolve, 5000))
        }

        constructor() {
            this.webSocket = new WebSocket(socket_url)
            this.setUpSocket()
        }
    }

    if (useGlobalSocket().value !== null) return

    useGlobalSocket().value = new ClientWebSocket()

    setTimeout(() => {
        if (useGlobalSocket().value.webSocket.readyState !== 1) {
            setTimeout(() => {
                if (useGlobalSocket().value.webSocket.readyState !== 1) {
                    useGlobalSocket().value.WsServerStatus = SocketStatus.CLOSED
                    useGlobalSocket().value.pollWsStatus()
                } else {
                    console.log('Socket seemed to have opened eventually')
                }
            }, 3000)
            console.log('Socket flagged as closed')
        } else if (Number(useGlobalSocket().value.webSocket.readyState) === 0) {
            useGlobalSocket().value.WsServerStatus = SocketStatus.UNKNOWN
            console.log('Socket flagged as unknown')
        }
    }, 3000)

    let lock: boolean = false
    watch(() => useGlobalSocket().value.WsServerStatus, async (newVal) => {
        if (!lock && newVal === SocketStatus.OPEN) {
            lock = true
            await useGlobalSocket().value.pollWsStatus()

            await new Promise<void>(resolve => setTimeout(() => {
                lock = false
                resolve()
            }, 30000))
        }
    })
})
