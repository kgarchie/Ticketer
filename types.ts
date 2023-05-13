import {WebSocket} from "ws";
import {Message} from "@prisma/client";

/*
    *  Define custom types here
 */
export type Client = {
    user_id: string | null;
    Socket: WebSocket;
}

export type MessageTemplate = {
    user_id: string,
    message_to: string,
    message_body: string,
    created_at: string | null,
    chat_id: string,
}


export type SearchQuery = {
    reference_number: string | undefined,
    userNameOrEmail: string | undefined,
    date_from: Date | undefined,
    date_to: Date | undefined
}


export type TaggedPerson = {
    name: string,
    user_id: string
}


export type SocketTemplate = {
    statusCode: number;
    type: TYPE;
    body?: any
}

export type HttpResponseTemplate = {
    statusCode: number;
    body?: any;
}

export type UserAuth = {
    auth_key: string | null,
    user_id: string,
    is_admin: boolean
}

export type LoginCredentials = {
    email: string,
    password: string
}

export type RegisterCredentials = {
    email: string,
    password: string,
    name: string,
    company: string | undefined,
    user_id: string,
}

export type UserChatObject = {
    id: string,
    created_at: Date,
    ticketId: number | null,
    chat_id: string | null,
    Message: Message[],
    user_id: string,
    WithUser: {
        name: string | null,
        email: string | null,
        company: string | null,
        is_admin: boolean
        user_id: string,
    }
}

export type adminUser = {
    id: number,
    name: string | null,
    email: string | null,
    company: string | null,
    is_admin: boolean,
    user_id: string
}


/*
    *  Define custom enums here
 */

export enum ServerStatus {
    UP = "UP",
    DOWN = "DOWN",
    Status = "status",
    UP_UNKNOWN = "UP but state UNKNOWN"
}

export enum SocketStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    UNKNOWN = "UNKNOWN"
}

export enum CHOICES {
    EA = "Excess Airtime", // Excess Airtime
    BWN = "Buying To Wrong Number", // Buying To Wrong Number
    NC = "Not Credited",// Not Credited
    O = "Others", // Others
    D = "Default"// Default
}

export enum STATUS {
    P = "Pending", // Pending
    R = "Resolved",// Resolved
    C = "Closed",// Closed
    O = "Open"// Opened
}

export enum URGENCY {
    D = "Default", // Default
    U = "Urgent",// Urgent
    E = "Emergency" // Emergency
}

export enum TYPE {
    MESSAGE = "MESSAGE",
    NOTIFICATION = "NOTIFICATION",
    NEW_MESSAGE_NOTIFICATION = "NEW_MESSAGE_NOTIFICATION",
    DETAILS_REQ = "details request",
    DETAILS_RES = "details response",
    HEARTBEAT = "heartbeat",
    DELETE_COMMENT = "delete comment",
    ERROR = "error",
    STATUS = "status",
    TAGGED = "tagged",
    NEW_COMMENT = "new comment",
    NEW_TICKET = "new ticket",
    UPDATE_TICKET = "update ticket",
    DELETE_TICKET = "delete ticket",
}

export enum TicketOperation {
    PEND = "PENDING",
    RESOLVE = "RESOLVED",
    CLOSE = "CLOSED",
    OPEN = "OPENED"
}

export enum CommentOperation {
    DELETE = "DELETE",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    TAG = "TAG"
}

export enum Initiator {
    TICKET = "TICKET",
    COMMENT = "COMMENT"
}


/*
    *  Define custom const here
 */

export const websocketPort = 9000;

export function PASSWORD_RESET_TEMPLATE(link:any) {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .email-content {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #1a1a1a;
        }

        .email-container {
            width: 400px;
            height: 300px;
            background: #fff;
            border-radius: 5px;
        }

        .email-header {
            background: linear-gradient(to bottom right, #9b08ff, #1ae7a3);
            color: #fff;
            text-align: center;
            padding: 20px 0;
        }

        .email-body {
            padding: 20px;
        }

        .email-footer {
            background: linear-gradient(to bottom right, #1ae7a3, #9b08ff);
            color: #fff;
            text-align: center;
            padding: 20px 0;
        }

        p {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
            font-weight: 300;
            line-height: 22px;
            margin: 0;
        }

        a {
            color: #9b08ff;
            text-decoration: none;
        }

        body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }
    </style>
</head>

<body>
    <div class="email-content">
        <div class="email-container">
            <div class="email-header">
                <h1>Password Reset</h1>
            </div>
            <div class="email-body">
                <p>Hi there, you can reset your password by clicking this <strong><a href="${link}">link</a></strong>.</p>
            </div>
            <div class="email-footer">
                <p>If you didn't request this, safely ignore this email.</p>
            </div>
        </div>
    </div>
</body>

</html>
`
}
