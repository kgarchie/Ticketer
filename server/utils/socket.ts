import { ulid } from "ulid"
import { SocketStatus, TYPE, type SocketTemplate } from "~/types"
import { H3Event } from "h3"
import { Peer } from "crossws"

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
        return this.value
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
}

export class Channels extends Map<string, Channel> {
    constructor() {
        super()
    }

    removeChannel(channel: string) {
        this.delete(channel)
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

    broadcast(data: any) {
        this.value.forEach(c => c.send(data))
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
    protected _events: Record<Events, Array<(data: any) => void>> | undefined;
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
        return this._events
    }
    subscribe(channel: string) {
        global.channels!.subscribe(this, channel)
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

    constructor(peer: Peer, state: SocketStatus) {
        super()
        this.peer = peer
        const _peer = global.clients!.getClient(peer.id) as unknown as Client | undefined
        if (_peer?.hasData()) {
            this._backpressure = _peer.backpressure
        }
        if (_peer && _peer instanceof WsClient) {
            this._id = _peer.id || ulid()
            this._backpressure = _peer.backpressure
            this._events = _peer.events
            global.clients!.replaceClient(this.id, this, false)
        } else {
            this._id = peer.id || ulid()
            global.clients!.push(this)
        }
        this.status = state
        if (state === SocketStatus.OPEN) {
            this.drain()
        }
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

    send(data: any, backpressure = true): void {
        try {
            this.peer.send(data)
        } catch (_) {
            console.error("Error sending data to peer", _)
            if (backpressure) this._backpressure.push(data)
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
    constructor(event: H3Event) {
        super()
        const id = getCookie(event, "X-Request-Id")
        if (id) {
            const client = global.clients!.getClient(id) as unknown as Client
            if (client?.hasData()) {
                this._backpressure = client.backpressure
            }

            if (client && client instanceof SseClient) {
                this._id = id
                this.eventStream = client.eventStream
            } else {
                deleteCookie(event, "X-Request-Id")
                this.setup(event)
            }
        } else {
            this.setup(event)
        }
    }

    private setup(event: H3Event) {
        this._id = ulid()
        setCookie(event, "X-Request-Id", this._id)
        this.eventStream = createEventStream(event) as any
        global.clients!.push(this)
        this.eventStream?.onClosed(() => {
            this.status = SocketStatus.CLOSED
            this.close()
            this.emit("end", null)
        })
        try {
            this.eventStream?.send()
            this.status = SocketStatus.OPEN
            this.drain()
        } catch (_) { }
    }

    get value() {
        return this.eventStream
    }

    get id() {
        return this._id!
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
    private _id: string;
    private _event: H3Event;
    private _storage = [];

    constructor(event: H3Event) {
        super()
        let id = getCookie(event, "X-Request-Id")
        if (!id) {
            id = ulid()
            setCookie(event, "X-Request-Id", id)
        }
        this._id = id
        this._event = event
        const _client = global.clients!.getClient(this.id) as PollClient
        if (_client?.hasData()) {
            const _data = _client.data
            event.respondWith(new Response(JSON.stringify(_data)))
            global.clients!.replaceClient(this.id, this)
        } else {
            global.clients!.push(this)
            event.respondWith(new Response(null))
        }
    }

    get id() {
        return this._id
    }

    get value() {
        return this._event
    }

    send(data: any): void {
        this._storage.push(data as unknown as never)
    }

    get data() {
        const data = this._storage
        this._storage = []
        return data
    }

    close() {
        global.clients!.removeClient(this.id)
    }

    [Symbol.dispose]() {
        this._event.node.res.end()
    }

    toString() {
        return `Poll Client ${this.id}`
    }
}