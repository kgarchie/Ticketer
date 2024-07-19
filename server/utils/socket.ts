import { ulid } from "ulid"
import { SocketStatus, TYPE, type SocketTemplate } from "~/types"
import { H3Event } from "h3"
import { Peer } from "crossws"
import { assert } from "node:console"

type Events = "data" | "error" | "end"
export class Clients extends Map<string, Client> {
    private _events: Record<Events, Array<(data: any, client: Client) => void>>;
    private _history: Record<Events, any>;
    constructor() {
        super()
        this._events = {
            data: [],
            error: [],
            end: []
        }
        this._history = {
            data: [],
            error: [],
            end: []
        }
    }

    get value() {
        return Array.from(this.values())
    }

    getClient(id: string | null) {
        if (!id) return null
        return this.get(id)
    }

    replaceClient(id: string, client: Client, close: boolean = true) {
        if (close) this.getClient(id)?.close()
        this.set(id, client)
    }

    findClientsByChannel(channel: string) {
        return global.channels!.getChannel(channel)?.clients || []
    }

    removeClient(id: string) {
        this.delete(id)
    }

    push(client: Client) {
        this.set(client.id, client)
        client.on("data", (data) => {
            this.emit("data", data, client)
        })
        client.on("error", (error) => {
            this.emit("error", error, client)
        })
        client.on("end", () => {
            this.emit("end", null, client)
        })
    }

    on(event: Events, callback: (data: any, client: Client) => void) {
        this._events[event].push(callback)
        this._history[event].forEach((_data: { data: any; client: Client; }) => callback(_data.data, _data.client))
    }

    emit(event: Events, data: any, client: Client) {
        this._history[event].push({ data, client })
        this._events[event].forEach(callback => callback(data, client))
    }

    broadcast(data: any) {
        this.forEach(client => {
            client.send(data)
        })
    }
}

export class Channels extends Map<string, Channel> {
    constructor() {
        super()
    }

    removeChannel(channel: string) {
        this.delete(channel)
    }

    getChannel(channel: string) {
        return this.get(channel)
    }

    get value() {
        return Array.from(this.values())
    }

    get clients() {
        return Array.from(this.values()).map(c => c.clients).flat()
    }

    unsubscribe(client: Client, channel: string) {
        client.channels.removeChannel(channel)
        const chan = this.get(channel)
        if (chan) {
            chan.remove(client)
        } else {
            console.warn("Channel not found")
        }
    }

    subscribe(client: Client, channel: string) {
        client.channels.push(new Channel(channel))
        const chan = this.get(channel)
        if (chan) {
            chan.add(client)
        } else {
            new Channel(channel).add(client)
        }
    }

    publish(channel: string, data: any) {
        const chan = this.get(channel)
        if (chan) {
            chan.send(data)
        } else {
            console.warn("Channel not found")
        }
    }

    push(channel: Channel) {
        this.set(channel.name, channel)
    }
}

export class Channel {
    public readonly name: string;
    private _clients: Clients;

    constructor(name: string) {
        this.name = name
        this._clients = new Clients()
        if (!global.channels) global.channels = new Channels()
        global.channels.push(this)
    }

    get clients() {
        return this._clients.value
    }

    add(client: Client) {
        this._clients.push(client)
    }

    remove(client: Client) {
        this._clients.removeClient(client.id)
    }

    send(data: any) {
        this._clients.forEach(c => c.send(data))
    }

    getSubscribers() {
        return this._clients
    }

}

export class Client {
    public channels: Channels = new Channels()
    private interval: NodeJS.Timeout | null = null
    private _events: Record<Events, Array<(data: any) => void>> | undefined;
    private _history: Record<Events, any> | undefined;
    protected _backpressure: any[] = []
    private _status: SocketStatus = SocketStatus.UNKNOWN
    constructor() {
        this._init()
    }
    private _init() {
        if (!global.clients) global.clients = new Clients()
        if (!global.channels) global.channels = new Channels()
        this._events = {
            data: [],
            error: [],
            end: []
        }
        this._history = {
            data: [],
            error: [],
            end: []
        }
    }
    get backpressure() {
        return this._backpressure
    }
    get events() {
        return this._events!
    }
    set events(events: Record<Events, Array<(data: any) => void>>) {
        this._events = events
    }
    get data() {
        const data = this._backpressure
        this._backpressure = []
        return data
    }
    subscribe(channel: string) {
        if (!global.channels) global.channels = new Channels()
        global.channels.subscribe(this, channel)
    }
    unsubscribe(channel: string) {
        global.channels!.unsubscribe(this, channel)
    }
    hasData() {
        return this._backpressure.length > 0
    }
    getChannels() {
        return this.channels.value
    }
    detailsRequest() {
        this.send({
            statusCode: 200,
            type: TYPE.AUTH_REQ,
        } satisfies SocketTemplate)
    }
    drain() {
        throw new Error("Method not implemented.")
    }
    ping() {
        this.send({
            statusCode: 200,
            type: TYPE.PING,
            body: "Pinging"
        } satisfies SocketTemplate)
    }
    pong() {
        this.send({
            statusCode: 200,
            type: TYPE.PONG,
            body: "Ponging"
        } satisfies SocketTemplate)
    }
    send(data: any) {
        throw new Error("Method not implemented.")
    }
    close() {
        throw new Error("Method not implemented.")
    }
    on(event: Events, callback: (data: any) => void) {
        this._history![event].forEach(callback)
        this._events![event].push(callback)
    }
    emit(event: Events, data: any) {
        this._history![event].push(data)
        this._events![event].forEach(callback => callback(data))
    }
    broadcast(data: any) {
        console.log("Broadcasting", data)
        console.log("Clients", global.clients?.value.length)
        global.clients!.forEach(client => {
            if (client.id !== this.id) {
                client.send(data)
            }
        })
    }
    get value(): any { throw new Error("Method not implemented.") }
    get type(): string { throw new Error("Method not implemented.") }
    get id(): string { throw new Error("Method not implemented.") }
    protected set status(state: SocketStatus) {
        this._status = state
    }
    protected get status() {
        return this._status
    }
    toString() {
        throw new Error("Method not implemented.")
    }
    [Symbol.dispose]() {
        clearInterval(this.interval!)
    }
}

export class WsClient extends Client {
    private peer: Peer;
    private _id: string;

    constructor(peer: Peer, state: SocketStatus, options?: { noAuth?: boolean }) {
        super()
        this.peer = peer
        this.status = state

        const existingPeer = global.clients!.getClient(peer.id)
        if (existingPeer) {
            this._id = existingPeer.id
            this._backpressure = existingPeer.backpressure
            this.events = existingPeer.events
            global.clients!.replaceClient(this.id, this, false)
            if (state === SocketStatus.OPEN) {
                this.drain()
            }
        } else {
            this._id = peer.id
            global.clients!.push(this)
            if(!options?.noAuth && state === SocketStatus.OPEN) {
                this.detailsRequest()
            }
        }
    }

    setup() {
        this.detailsRequest()
        this.on("data", data => {
            const { data: _data } = parseData(data)
            if (!isSocketTemplate(_data)) return
            switch (_data?.type) {
                case TYPE.AUTH_RES:
                    this.subscribe(_data.body)
                    break
            }
        })
    }

    get id(): string {
        return this._id
    }

    get peer_id() {
        return this.peer.id
    }

    get value() {
        return this.peer
    }

    get type() {
        return "WebSocket Cient"
    }

    send(data: any, fallback = true): void {
        try {
            const _data = typeof data === "string" ? data : JSON.stringify(data)
            this.peer.send(_data)
        } catch (_) {
            console.error("Error sending data to peer", _)
            if (fallback) {
                this._backpressure.push(data)
            } else {
                this.close()
            }
            this.status = SocketStatus.CLOSED
            this.emit("error", _)
        }
    }

    drain(): void {
        if (this._backpressure.length > 0) {
            this._backpressure.forEach(data => this.send(data, false))
            this._backpressure = []
        }
    }

    close() {
        this.value.ctx?.node?.req?.socket?.destroy()
        this.status = SocketStatus.CLOSED
        global.clients!.removeClient(this.id)
    }

    toString() {
        return `WS Client ${this.id}`
    }
}

interface EventStreamOptions {
    /**
     * Automatically close the writable stream when the request is closed
     *
     * Default is `true`
     */
    autoclose?: boolean;
}

/**
 * See https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
 */
interface EventStreamMessage {
    id?: string;
    event?: string;
    retry?: number;
    data: string;
}

declare class EventStream {
    private readonly _h3Event;
    private readonly _transformStream;
    private readonly _writer;
    private readonly _encoder;
    private _writerIsClosed;
    private _paused;
    private _unsentData;
    private _disposed;
    private _handled;
    constructor(event: Event, opts?: EventStreamOptions);
    /**
     * Publish new event(s) for the client
     */
    push(message: string): Promise<void>;
    push(message: string[]): Promise<void>;
    push(message: EventStreamMessage): Promise<void>;
    push(message: EventStreamMessage[]): Promise<void>;
    private _sendEvent;
    private _sendEvents;
    pause(): void;
    get isPaused(): boolean;
    resume(): Promise<void>;
    flush(): Promise<void>;
    /**
     * Close the stream and the connection if the stream is being sent to the client
     */
    close(): Promise<void>;
    /**
     * Triggers callback when the writable stream is closed.
     * It is also triggered after calling the `close()` method.
     * It also triggers when the request connection has been closed by either the client or the server.
     */
    onClosed(cb: () => any): void;
    send(): Promise<void>;
}

export class SseClient extends Client {
    private eventStream: EventStream | undefined;
    private _id: string | undefined;
    constructor(event: H3Event, status: SocketStatus = SocketStatus.OPEN) {
        super()
        const id = getCookie(event, "X-Request-Id")
        if (status === SocketStatus.OPEN) {
            if (id) {
                const client = global.clients!.getClient(id)
                if (client) {
                    this._id = id
                    this.events = client.events
                    this._backpressure = client.backpressure
                    this.eventStream = createEventStream(event) as any
                    this.eventStream?.send()
                    global.clients!.replaceClient(id, this, false)
                } else {
                    deleteCookie(event, "X-Request-Id")
                    this.setup(event)
                }
            } else {
                this.setup(event)
            }
        } else {
            const client = global.clients!.getClient(id!)
            if (client) {
                readBody(event).then(data => {
                    client.emit("data", data)
                    event.respondWith(new Response(null, { status: 204 }))
                })
            } else {
                this.setup(event)
                readBody(event).then(data => {
                    this.emit("data", data)
                    event.respondWith(new Response(null, { status: 204 }))
                })
            }
        }
    }

    private setup(event: H3Event) {
        this._id = ulid()
        setCookie(event, "X-Request-Id", this._id)
        this.eventStream = createEventStream(event) as any
        this.eventStream?.onClosed(() => {
            this.status = SocketStatus.CLOSED
            this.close()
            this.emit("end", null)
        })
        try {
            this.eventStream?.send()
            this.status = SocketStatus.OPEN
            this.drain()
        } catch (_) {
            console.error("Error sending data to client", _)
        }
        global.clients!.push(this)
        this.detailsRequest()
        this.on("data", data => {
            const { data: _data } = parseData(data)
            if (!isSocketTemplate(_data)) return
            switch (_data?.type) {
                case TYPE.AUTH_RES:
                    this.subscribe(_data.body)
                    break
            }
        })
    }

    get value() {
        return this.eventStream
    }

    get id() {
        return this._id!
    }

    get type() {
        return "SSE Client"
    }

    send(data: any, backpressure = true): void {
        try {
            if (typeof data === "string") {
                this.eventStream?.push(data)
            } else {
                this.eventStream?.push(JSON.stringify(data))
            }
        } catch (_) {
            if (backpressure) this._backpressure.push(data)
            this.status = SocketStatus.CLOSED
            this.emit("error", _)
        }
    }

    drain(): void {
        if (this._backpressure.length > 0) {
            this._backpressure.forEach(data => this.send(data, false))
            this._backpressure = []
        }
    }

    close() {
        this.eventStream?.close()
        this.status = SocketStatus.CLOSED
        global.clients!.removeClient(this.id!)
        this.emit("end", null)
    }

    [Symbol.dispose]() {
        this.eventStream?.close()
    }

    toString() {
        return `SSE Client ${this.id}`
    }
}


export class PollClient extends Client {
    private _id?: string;
    private _H3Event: H3Event | undefined;
    constructor(event: H3Event, status: SocketStatus = SocketStatus.OPEN) {
        super()
        this._H3Event = event

        const id = getCookie(event, "X-Request-Id")
        if (id) {
            const client = global.clients!.getClient(id)
            if (client) {
                this._id = id
                this.events = client.events
                this._backpressure = client.backpressure
                global.clients!.replaceClient(id, this, false)
            } else {
                deleteCookie(event, "X-Request-Id")
                this.setup(event)
            }
        } else {
            this.setup(event)
        }

        if (status === SocketStatus.OPEN) {
            this._H3Event?.respondWith(new Response(JSON.stringify(this.data), { status: 200 }))
        } else {
            readBody(event).then(data => {
                this.emit("data", data)
                this._H3Event?.respondWith(new Response(null, { status: 204 }))
            })
        }
    }

    private setup(event: H3Event) {
        this._id = ulid()
        setCookie(event, "X-Request-Id", this._id)
        global.clients!.push(this)
        this.detailsRequest()
        this.on("data", data => {
            const { data: _data } = parseData(data)
            if (!isSocketTemplate(_data)) return
            switch (_data?.type) {
                case TYPE.AUTH_RES:
                    this.subscribe(_data.body)
                    break
            }
        })
    }

    get id() {
        return this._id!
    }

    get value() {
        return this._H3Event
    }

    get type() {
        return "Poll Client"
    }

    send(data: any): void {
        this._backpressure.push(data as unknown as never)
    }

    close() {
        global.clients!.removeClient(this.id)
    }

    [Symbol.dispose]() {
        this._H3Event!.node.res.end()
    }

    toString() {
        return `Poll Client ${this.id}`
    }
}