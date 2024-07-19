import type { Peer } from "crossws";
import { WsClient } from "../utils/socket";
import { SocketStatus, type SocketTemplate, TYPE } from "~/types";

export default defineWebSocketHandler({
    open(peer: Peer) {
        const client = new WsClient(peer, SocketStatus.OPEN)
        client.send({
            statusCode: 200,
            type: TYPE.IDENTITY,
            body: client.id
        } satisfies SocketTemplate)
        // client.close()
    },
    message(peer: Peer, message) {
        const client = new WsClient(peer, SocketStatus.OPEN, {
            noAuth: true
        })
        client.emit("data", message)
    },
    close(peer: Peer, event) {
        const client = new WsClient(peer, SocketStatus.CLOSED)
        client.emit("end", event)
    },
    error(peer: Peer, error) {
        const client = new WsClient(peer, SocketStatus.CLOSED)
        client.emit("error", error)
    },
})