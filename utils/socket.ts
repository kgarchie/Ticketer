import { SocketStatus, TYPE, type SocketTemplate } from "~/types";

type Events = "data" | "error" | "open" | "close"
abstract class _RealTime {
    push(data: any) { }
    setup() { }
    on(event: Events, callback: Function) { }
    emit(event: Events, data: any) { }
    close() { }
    get value(): any { return null }
    static get type(): string { return "RealTime" }
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
            this.emit("data", event.data)
        }
        this.eventSource.onerror = (event) => {
            this.emit("error", event)
            this.emit("close", event)
        }
        this.eventSource.onopen = (event) => {
            this.emit("open", event)
        }
    }
    async push(data: any, options?: any) {
        return await $fetch("/sse/put", {
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
        this.eventSource.close()
    }
    get value() {
        return this.eventSource
    }
    static get type() {
        return "SSE"
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
            await $fetch<SocketTemplate>("/poll/get", {
                method: "GET"
            }).then(response => {
                try {
                    if (Array.isArray(response)) {
                        response.forEach(data => this.emit("data", data))
                    } else {
                        this.emit("data", response)
                    }
                } catch (_) { }
            }).catch(error => {
                console.error("Error", error)
                this.emit("error", error)
            })
        }, this.intervalTime)
        this.emit("open", null)
    }
    async push(data: any, options?: any) {
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
        return "Poll"
    }
    [Symbol.dispose]() {
        clearInterval(this.interval)
    }
}

class WS implements _RealTime {
    private ws: WebSocket
    private _events: Record<Events, Array<(data: any) => void>>;
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
                    this.ws.close()
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
    async push(data: any, options?: any) {
        this.ws.send(data)
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
        return "WS"
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
    constructor() {
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

        rt.on("open", () => {
            this.status = SocketStatus.OPEN
        })
        rt.on("close", () => {
            this.status = SocketStatus.CLOSED
            this.retry()
        })
        rt.on("error", () => {
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

    push(data: any) {
        if (this.status === SocketStatus.OPEN) {
            this.current!.value.push(data)
        } else {
            this._backpressure.push(data)
        }
    }

    drain() {
        this._backpressure.forEach(data => {
            this.current!.value.push(data)
        })
        this._backpressure = []
    }

    on(event: Events, callback: (data: any) => void) {
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