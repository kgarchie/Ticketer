import { TYPE, type SocketTemplate } from "~/types";
import { Clients, Channels } from "../utils/socket";

declare global {
    var clients: Clients | undefined
    var channels: Channels | undefined;
}

export default defineNitroPlugin(app => {
    global.clients!.on("data", (data, client) => {
        console.log("Data", data)
        try {
            var response = JSON.parse(data.toString()) as SocketTemplate;
            console.log("Response", response)
        } catch (error) {
            client.emit("error", error)
        }
    })

    global.clients!.on("end", () => {
        console.log("End")
    })

    global.clients!.on("error", (error, client) => {
        const response = {
            statusCode: 400,
            type: TYPE.ERROR,
            body: "Invalid Json"
        } as SocketTemplate
        client.send(response)
        console.error("Error", error)
    })
})