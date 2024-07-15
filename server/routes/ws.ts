import type { Peer } from "crossws";
import { WsClient } from "../utils/socket";

export default defineWebSocketHandler({
    open(peer: Peer & { client?: WsClient }) {
        console.log("Client Connected to WS")
        peer.client = new WsClient(peer)
        peer.client.close()
    },
    message(peer: Peer & { client?: WsClient }, message) {
        peer.client?.emit("data", message) || console.error("No Shimmed Peer", peer)
        console.log("Message", message)
    },
    close(peer: Peer & { client?: WsClient }, event) {
        peer.client?.emit("end", event) || console.error("No Shimmed Peer", peer)
    },
    error(peer: Peer & { client?: WsClient }, error) {
        peer.client?.emit("error", error) || console.error("No Shimmed Peer", peer)
    },
})