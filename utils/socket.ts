import { SocketStatus, TYPE, type SocketTemplate } from "~/types";
import consola from "consola";

type Events = "data" | "error" | "open" | "close"
abstract class _RealTime {
    push(data: string) { }
    setup() { }
    on(event: Events, callback: Function) { }
    emit(event: Events, data: any) { }
    close() { }
    get value(): any { return null }
    static get type(): string { return "RealTime" }
    set events(events: Record<Events, Array<(data: any) => void>>) { }
}

class SSE implements _RealTime {
    private eventSource: EventSource
    private _events: Record<Events, Array<(data: any) => void>>;
    private _history: Record<Events, any>;
    constructor() {
        const eventSource = new EventSource("/sse/get")
        this.eventSource = eventSource
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this.setup()
    }
    setup() {
        this.eventSource.onmessage = (event) => {
            try {
                var data = JSON.parse(event.data)
            } catch (_) {
                var data = event.data
            }
            this.emit("data", data)
        }
        this.eventSource.onerror = (event) => {
            this.emit("error", event)
            this.emit("close", event)
        }
        this.eventSource.onopen = (event) => {
            this.emit("open", event)
        }
    }
    async push(data: string, options?: any) {
        return await $fetch("/sse/put", {
            method: "POST",
            body: data,
            ...options
        }).then((_response: any) => {
            try {
                var response = JSON.parse(_response)
                this.emit("data", response)
            } catch (_) {
                this.emit("data", _response)
            }
            return true;
        }).catch(error => {
            console.error("Error", error)
            return false;
        })
    }
    on(event: Events, callback: (data: any) => void) {
        this._events[event].push(callback)
        this._history[event].forEach(callback)
    }
    emit(event: Events, data: any): void {
        this._events[event].forEach(callback => callback(data))
        this._history[event].push(data)
    }
    close(): void {
        this.eventSource.close()
    }
    get value() {
        return this.eventSource
    }
    static get type() {
        return "Server Side Events"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    [Symbol.dispose]() {
        this.eventSource.close()
    }
}


class Poll implements _RealTime {
    private _events: Record<Events, Array<(data: any) => void>>;
    private _history: Record<Events, any>;
    private interval: NodeJS.Timeout | undefined;
    private intervalTime: number = 1000 * 5 // 5 seconds
    constructor() {
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this.setup()
    }
    setup(): void {
        this.interval = setInterval(async () => {
            await $fetch<string>("/poll/get", {
                method: "GET"
            }).then(_response => {
                try {
                    var response = JSON.parse(_response)
                    if (Array.isArray(response)) {
                        response.forEach(data => this.emit("data", data))
                    } else {
                        this.emit("data", response)
                    }
                } catch (_) {
                    this.emit("data", _response)
                }
            }).catch(error => {
                console.error("Error", error)
                this.emit("error", error)
            })
        }, this.intervalTime)
        this.emit("open", null)
    }
    async push(data: string, options?: any) {
        return await $fetch("/poll/put", {
            method: "POST",
            body: data,
            ...options
        }).then(response => {
            console.log("Response", response)
            return true;
        }).catch(error => {
            console.error("Error", error)
            return false;
        })
    }
    on(event: Events, callback: (data: any) => void) {
        this._events[event].push(callback)
        this._history[event].forEach(callback)
    }
    emit(event: Events, data: any): void {
        this._events[event].forEach(callback => callback(data))
        this._history[event].push(data)
    }
    close(): void {
        clearInterval(this.interval)
    }
    get value() {
        return null
    }
    static get type() {
        return "Long Polling"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    [Symbol.dispose]() {
        clearInterval(this.interval)
    }
}

class WS implements _RealTime {
    private ws: WebSocket
    _events: Record<Events, Array<(data: any) => void>>;
    private _history: Record<Events, any>;
    constructor() {
        const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`)
        this.ws = ws
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        this.setup()
    }
    setup() {
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as SocketTemplate
                if (data?.type === TYPE.CLOSE_SOCKET) {
                    this.close()
                }
                this.emit("data", data)
            } catch (_) {
                this.emit("data", event.data)
            }
        }
        this.ws.onerror = (event) => {
            this.emit("error", event)
        }
        this.ws.onopen = (event) => {
            this.emit("open", event)
        }
        this.ws.onclose = (event) => {
            this.emit("close", event)
        }
    }
    async push(data: string, options?: any) {
        this.ws.send(data)
        return Promise.resolve(true)
    }
    on(event: Events, callback: (data: any) => void) {
        this._events[event].push(callback)
        this._history[event].forEach(callback)
    }
    emit(event: Events, data: any): void {
        this._events[event].forEach(callback => callback(data))
        this._history[event].push(data)
    }
    close() {
        this.ws.close()
    }
    get value() {
        return this.ws
    }
    static get type() {
        return "WebSocket"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    [Symbol.dispose]() {
        this.ws.close()
    }
}


export class RealTime {
    private current: {
        type: string,
        value: _RealTime,
        priority: number
    } | null = null
    private _status: SocketStatus = SocketStatus.CLOSED
    private _backpressure: any[] = []
    private _events: Record<Events, Array<(data: any) => void>>;
    constructor() {
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        if (!process.client) return
        this.init()
    }

    private init(priority = 1) {
        switch (priority) {
            case 1:
                var rt = new WS() as _RealTime
                this.current = {
                    type: WS.type,
                    value: rt,
                    priority: priority
                }
                break
            case 2:
                var rt = new SSE() as _RealTime
                this.current = {
                    type: SSE.type,
                    value: rt,
                    priority: priority
                }
                break
            case 3:
                var rt = new Poll() as _RealTime
                this.current = {
                    type: Poll.type,
                    value: rt,
                    priority: priority
                }
                break
            default:
                throw new Error("Invalid priority")
        }

        this.on("open", () => {
            this.status = SocketStatus.OPEN
            this.drain()
            this.syncEventListeners(this.current!.value)
            consola.success("RealTime connection established via", this.current!.type)
        })
        this.on("close", () => {
            this.status = SocketStatus.CLOSED
            this.retry()
        })
        this.on("error", () => {
            this.status = SocketStatus.UNKNOWN
            this.handleError.bind(this)
        })
    }

    handleError(error: any) {
        console.error("Error", error)
        console.info("Retrying with the next priority")
        if (this.status === SocketStatus.CONNECTING) return
        this.retry(0)
    }

    retry(intervalSeconds: number = 4) {
        this.status = SocketStatus.CONNECTING
        const interval = setInterval(() => {
            if (this.status === SocketStatus.OPEN) {
                clearInterval(interval)
                this.syncEventListeners(this.current!.value)
                this.drain()
            } else {
                this.current!.value?.close()
                if (this.current!.priority === 3) {
                    clearInterval(interval)
                    console.error("All RealTime connections failed: Stopped")
                } else {
                    console.info("Retrying with the next priority", this.current!.priority + 1)
                    this.init(this.current!.priority + 1)
                }
            }
        }, intervalSeconds * 1000)
    }

    push(data: unknown) {
        if (typeof data !== "string") {
            var _data = JSON.stringify(data)
        } else {
            var _data = data
        }
        if (this.status === SocketStatus.OPEN) {
            this.current!.value.push(_data)
        } else {
            this._backpressure.push(_data)
        }
    }

    private syncEventListeners(target: _RealTime) {
        target.events = this._events
    }

    drain() {
        this._backpressure.forEach(data => {
            this.current!.value.push(data)
        })
        this._backpressure = []
    }

    on(event: Events, callback: (data: any) => void) {
        this._events[event].push(callback)
        this.current!.value.on(event, callback)
    }

    get value() {
        return this.current!.value
    }

    get status() {
        return this._status
    }

    set status(status: SocketStatus) {
        this._status = status
    }
}