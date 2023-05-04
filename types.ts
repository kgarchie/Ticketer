import {WebSocket} from "ws";
import {Comment, Message, Ticket} from "@prisma/client";

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

export type Payload = {
    data: Object | Message | Notification | Comment | Ticket
}

export type SearchQuery = {
    reference_number: string | undefined,
    userNameOrEmail: string | undefined,
    date_from: Date | undefined,
    date_to: Date | undefined
}

export enum SocketResponseType {
    MESSAGE = "MESSAGE",
    NOTIFICATION = "NOTIFICATION",
    TICKET = "TICKET",
    DETAILS_REQ = "details request",
    DETAILS_RES = "details response",
    HEARTBEAT = "heartbeat",
    ACTION = "action",
    ERROR = "error",
    STATUS = "status"
}

export type Action = {
    actor: Actor
    act: CommentAct | TicketAct
    payload: Payload
}

export type SocketResponseTemplate = {
    statusCode: number;
    type: SocketResponseType;
    body: CannedResponseMessages | Payload | Action | string | null
}

export type HttpResponseTemplate = {
    statusCode: number;
    type: HttpResponseType;
    body: CannedResponseMessages | Payload | null
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

export type Notification = {
    id: string,
    for_user_id: string,
    message: string,
    created_at: string,
    opened: boolean,
}

export type ChatsResponseObject = {
    id: string,
    created_at: Date,
    ticketId: number | null,
    chat_id: string,
    Message: Message[],
    to_user: {
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
export enum HttpResponseType {
    ERROR = "error",
    SUCCESS = "success",
    FORBIDDEN = "forbidden"
}

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

export enum CannedResponseMessages {
    INVALID_JSON = "Invalid JSON: ",
    RESPONSE_EMPTY = "Response is empty",
    CLIENT_CONNECTED = "Client connected: ",
    CLIENT_DISCONNECTED = "Client disconnected: ",
    USER_NOT_FOUND = "User not found: ",
    DETAILS_ACK = "Details received: ",
    CLIENT_ADDED = "Client Added: ",
    CLIENT_UPDATED = "Client Updated: ",
    DRAIN = "Drain: ",

    NO_USER_PROVIDED = "no user provided",
    MESSAGE_SENT = "Message sent successfully",
    MESSAGE_RECEIVED = "Message received",
    RECEIVER_NOT_FOUND = "Receiver not found: ",
    CANT_CREATE_CHAT = "Could not create chat: ",
    CANT_CREATE_MESSAGE = "Could not create message: ",
    TICKET_EXISTS = "Ticket reference already exists",
    CANT_CREATE_TICKET = "Could not create ticket: ",
    NO_AUTH_COOKIE = "No auth cookie",
    NO_AUTH_KEY = "No auth key",
    USER_ALREADY_EXISTS = "User already exists",
    NO_DETAILS_PROVIDED = "No details provided",
    REQUEST_FAILED = "Request failed",
    REQUEST_SUCCESS = "Request successful",
    NOT_FOUND = "Not found",
    INTERNAL_SERVER_ERROR = "Internal server error",
    ALREADY_LOGGED_IN = "Already logged in",
    CREATED_SUCCESS = "Created successfully",
    CREATED_FAILED = "Creation failed",
    NO_ID_PROVIDED = "No id provided",
    LOGIN_FAILED = "Login failed",
    LOGIN_SUCCESS = "Login successful",
    NO_CHAT_PROVIDED = "No chat provided",
    NO_COMPANY_ID_PROVIDED = "No company id provided",
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
    O = "Opened"// Opened
}

export enum URGENCY {
    D = "Default", // Default
    U = "Urgent",// Urgent
    E = "Emergency" // Emergency
}

export enum NOTIFICATION_TYPE {
    T = "New Ticket", // New Ticket
    N = "New Notification"// New Notification
}

export enum TicketAct {
    PEND = "PENDING",
    RESOLVE = "RESOLVED",
    CLOSE = "CLOSED",
    OPEN = "OPENED"
}

export enum CommentAct {
    DELETE = "DELETE",
    CREATE = "CREATE",
    UPDATE = "UPDATE"
}

export enum Actor {
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
            display: flex;
            flex-direction: column;
            justify-content: space-between;
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
