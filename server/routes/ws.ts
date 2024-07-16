import type { Peer } from "crossws";
import { WsClient } from "../utils/socket";
import { SocketStatus } from "~/types";

export default defineWebSocketHandler({
    open(peer: Peer) {
        const client = new WsClient(peer, SocketStatus.OPEN)
    },
    message(peer: Peer, message) {
        const client = new WsClient(peer, SocketStatus.OPEN)
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