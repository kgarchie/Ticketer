import { WebSocket } from "ws";
import {Message, Comment, Ticket} from "@prisma/client";

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