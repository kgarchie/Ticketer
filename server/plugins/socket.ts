import { TYPE, type SocketTemplate } from "~/types";
import { Clients, Channels } from "../utils/socket";

declare global {
    var clients: Clients | undefined
    var channels: Channels | undefined;
}

export default defineNitroPlugin(app => {
    global.clients = new Clients()
    global.channels = new Channels()

    global.clients!.on("data", (data, client) => {
        try {
            var response = JSON.parse(data) as SocketTemplate
        } catch (error) {
            var response = data as SocketTemplate
        }
        switch (response.type) {
            case TYPE.AUTH:
                client.subscribe(response.body)
            break
        }
        global.channels!.broadcast(response)
    })

    global.clients!.on("end", (data, client) => {
        console.log(client.id, "Disconnected")
    })

    global.clients!.on("error", (error, client) => {
        const response = {
            statusCode: 400,
            type: TYPE.ERROR,
            body: "Invalid Json"
        } as SocketTemplate
        client.send(response)
        client.close()
        console.error("Error", error)
    })
})