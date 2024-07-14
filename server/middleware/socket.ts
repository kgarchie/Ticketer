// Define the function to handle incoming events
export default defineEventHandler((event) => {
    // // @ts-ignore
    // let server = event.node.res.socket?.server;
    // if (!global.wss && server) {
    //     if(process.env?.DEV === "true") {
    //         wss = new WebSocketServer({host: "localhost", port: websocketPort});
    //     } else {
    //         wss = new WebSocketServer({server: server});
    //     }

    //     wss.on("connection", (ws) => {
    //         ws.on("message", (message: any) => {
    //             // TODO: In need of a guard against DDOS attacks, need to implement a rate limiter
    //             let SocketResponse: SocketTemplate | null = null;

    //             try {

    //             } catch (e) {
    //                 const response = {
    //                     statusCode: 400,
    //                     type: TYPE.ERROR,
    //                     body: "Invalid Json"
    //                 } as SocketTemplate

    //                 socketSendData(ws, JSON.stringify(response)).then(() => console.log("Invalid Json"))
    //                 return
    //             }

    //             switch (SocketResponse?.type) {
    //                 case TYPE.DETAILS_RES:
    //                     const user_id = SocketResponse?.body as string | null;

    //                     clients = global.clients;

    //                     if (!user_id) {
    //                         let response = JSON.stringify({
    //                             statusCode: 200,
    //                             type: TYPE.ERROR,
    //                             body: "No User Id Sent To Socket Server"
    //                         } as SocketTemplate);

    //                         socketSendData(ws, response).then(() => console.log("No User Id Sent To Socket Server"))
    //                         break;
    //                     }

    //                     let client = clients.find((c) => c.Socket === ws) || null

    //                     if (client) {
    //                         client.user_id = user_id
    //                         message = "Client Updated"
    //                         clients.push(client);
    //                     } else {
    //                         clients.push({user_id: user_id, Socket: ws});
    //                         message = "Client Added"
    //                     }

    //                     global.clients = clients;

    //                     console.log(message)

    //                     // send a message to the client to confirm the connection
    //                     let response = JSON.stringify({
    //                         statusCode: 200,
    //                         type: TYPE.DETAILS_RES,
    //                         body: message
    //                     } as SocketTemplate);

    //                     socketSendData(ws, response).then(() => console.log("Client Added"))
    //                     // removeDuplicates();
    //                     break;
    //                 case TYPE.STATUS:
    //                     let res = JSON.stringify({
    //                         statusCode: 200,
    //                         type: TYPE.STATUS,
    //                         body: SocketStatus.OPEN
    //                     } as SocketTemplate);

    //                     socketSendData(ws, res).then(() => console.log("Server status Sent to client", ws))
    //                     break;
    //                 default:
    //                     console.log(SocketResponse);
    //                     break;
    //             }

    //         });

    //         ws.on("close", () => {
    //             console.log("Client disconnected")
    //             // console.debug(ws)
    //             global.clients = global.clients.filter((c) => c.Socket !== ws)
    //         });

    //         const client: Client = {
    //             user_id: null,
    //             Socket: ws
    //         };

    //         // add the client to the global clients array
    //         clients.push(client)

    //         // set the global clients array
    //         global.clients = clients

    //         // Due to stability issues this may not always work. Need to introduce a retry mechanism or forced wait on the client side
    //         setTimeout(() => {
    //             promptDetails(client)
    //         }, 500)

    //         console.log("Client connected")
    //     });

    //     // set the global WebSocket server
    //     global.wss = wss;
    // }
});

// export function promptDetails(client: Client) {
//     if (client.Socket) {
//         const response = JSON.stringify({
//             statusCode: 200,
//             type: TYPE.DETAILS_REQ
//         } as SocketTemplate)
//         socketSendData(client.Socket, response)
//     } else {
//         console.log("No client or socket provided")
//     }
// }

// function monitor() {
//     const clients = global.clients;
//     if (clients && clients.length > 0) {
//         clients.forEach((client) => {
//             if (client.user_id == null) {
//                 promptDetails(client);
//             } else {
//                 // console.log("Sending heartbeat to: " + client.user_id);
//                 const response = JSON.stringify({
//                     statusCode: 200,
//                     type: TYPE.HEARTBEAT
//                 } as SocketTemplate)

//                 socketSendData(client.Socket, response)
//             }
//         });
//     } else {
//         console.log("No clients connected");
//     }
// }


// function monitorClientConnections() {
//     console.log("Monitoring clients");
//     // Send periodic heartbeats to all connected clients
//     setInterval(() => {
//         monitor()
//     }, 100000);
// }

// monitorClientConnections();

