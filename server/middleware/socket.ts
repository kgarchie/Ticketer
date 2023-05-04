import {
    CannedResponseMessages,
    Client,
    ServerStatus,
    SocketResponseTemplate,
    SocketResponseType, websocketPort
} from "~/types";
import {WebSocketServer} from "ws"
import {promptDetails, socketSendData} from "~/helpers/socketHelpers";

// Declare the global WebSocket server
declare global {
    var wss: WebSocketServer;
    var clients: Client[];
}

let wss: WebSocketServer
let clients: Client[] = []

// Define the function to handle incoming events
export default defineEventHandler((event) => {
    // @ts-ignore
    let server = event.node.res.socket?.server;
    if (!global.wss && server) {
        // Production
        wss = new WebSocketServer({server: server});

        // Development
        // wss = new WebSocketServer({ port: websocketPort, host: "localhost" });

        wss.on("connection", (ws) => {
            const client: Client = {
                user_id: null,
                Socket: ws
            };

            // add the client to the global clients array
            clients.push(client);

            // set the global clients array
            global.clients = clients;

            // Due to stability issues this may not always work. Need to introduce a retry mechanism or forced wait on the client side
            setTimeout(() => {
                promptDetails(client);
            }, 500)


            console.log(CannedResponseMessages.CLIENT_CONNECTED);

            ws.on("close", () => {
                clients = global.clients
                if(clients?.length > 0) {
                    clients = clients.filter((c) => c.Socket !== ws)
                    console.log(CannedResponseMessages.CLIENT_DISCONNECTED, client.user_id)
                    global.clients = clients;
                }
            });

            ws.on("message", (message: any) => {
                // in need of a guard against DDOS attacks
                let SocketResponse: SocketResponseTemplate | null = null;

                try {
                    SocketResponse = JSON.parse(message.toString()) as SocketResponseTemplate || null;
                } catch (e) {
                    console.log(CannedResponseMessages.INVALID_JSON, message, "It needs to be of type SocketResponseTemplate")

                    const response = {
                        statusCode: 400,
                        type: SocketResponseType.ERROR,
                        body: CannedResponseMessages.INVALID_JSON
                    } as SocketResponseTemplate

                    socketSendData(ws, JSON.stringify(response))
                }


                switch (SocketResponse?.type) {
                    case SocketResponseType.DETAILS_RES:
                        const user_id = SocketResponse?.body as string | null;

                        clients = global.clients;

                        let client = clients.find((c) => c.Socket === ws) || null
                        let message: string

                        if (!user_id) {
                            // send a message to the client to confirm the connection
                            let response = JSON.stringify({
                                statusCode: 200,
                                type: SocketResponseType.ERROR,
                                body: CannedResponseMessages.NO_ID_PROVIDED
                            } as SocketResponseTemplate);

                            socketSendData(ws, response)
                            break;
                        }

                        if (client) {
                            client.user_id = user_id.toString();
                            message = CannedResponseMessages.CLIENT_UPDATED
                            clients.push(client);
                        } else {
                            clients.push({user_id: user_id.toString(), Socket: ws});
                            message = CannedResponseMessages.CLIENT_ADDED
                        }

                        global.clients = clients;

                        console.log(message)

                        // send a message to the client to confirm the connection
                        let response = JSON.stringify({
                            statusCode: 200,
                            type: SocketResponseType.DETAILS_RES,
                            body: message
                        } as SocketResponseTemplate);

                        socketSendData(ws, response)
                        // removeDuplicates();
                        break;
                    case SocketResponseType.STATUS:
                        let res = JSON.stringify({
                            statusCode: 200,
                            type: SocketResponseType.STATUS,
                            body: ServerStatus.UP
                        } as SocketResponseTemplate);

                        socketSendData(ws, res)
                        break;
                    default:
                        console.log(SocketResponse);
                        break;
                }

            });
        });

        // set the global WebSocket server
        global.wss = wss;
    }
});

function monitor() {
    const clients = global.clients;
    if (clients && clients.length > 0) {
        clients.forEach((client) => {
            if (client.user_id == null) {
                promptDetails(client);
            } else {
                // console.log("Sending heartbeat to: " + client.user_id);
                const response = JSON.stringify({
                    statusCode: 200,
                    type: SocketResponseType.HEARTBEAT
                } as SocketResponseTemplate)

                socketSendData(client.Socket, response)
            }
        });

        // removeDuplicates();
    } else {
        console.log("No clients connected");
    }
}


function monitorClientConnections() {
    console.log("Monitoring clients");
    // Send periodic heartbeats to all connected clients
    setInterval(() => {
        monitor()
    }, 100000); // Send heartbeat every 100 seconds
}

function removeDuplicates() {
    // if there are duplicate client_id with their sockets, close the former of the duplicate client and sockets and remove the duplicates
    // note this also removes the previous client tab that was open if client opened a new tab/browser even if it's different user_id... bug
    let local_clients = global.clients;
    let client_ids = local_clients.map((c) => c.user_id);
    let duplicate_client_ids = client_ids.filter((id, index) => client_ids.indexOf(id) != index);
    let duplicate_clients = local_clients.filter((c) => duplicate_client_ids.includes(c.user_id));

    let sockets = duplicate_clients.map((c) => c.Socket);
    let duplicate_sockets = sockets.filter((s, index) => sockets.indexOf(s) != index);

    duplicate_sockets.forEach((s) => {
        s.close();
    });

    global.clients = local_clients.filter((c) => !duplicate_sockets.includes(c.Socket));
}


monitorClientConnections();

