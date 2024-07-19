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
    get type(): string { return "RealTime" }
    set events(events: Record<Events, Array<(data: any) => void>>) { }
    get events(): Record<Events, Array<(data: any) => void>> { return { data: [], error: [], open: [], close: [] } }
    set backpressure(data: any[]) { }
    get status(): SocketStatus { return SocketStatus.CLOSED }
    get backpressure(): any[] { return [] }
}

class SSE implements _RealTime {
    private eventSource: EventSource
    private _events: Record<Events, Array<(data: any) => void>>;
    private _history: Record<Events, any>;
    private _backpressure: any[] = []
    private _status: SocketStatus = SocketStatus.CLOSED
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
            const data = parseData(event.data)
            this.emit("data", data)
        }
        this.eventSource.onerror = (event) => {
            this.emit("error", event)
            this._status = SocketStatus.UNKNOWN
        }
        this.eventSource.onopen = (event) => {
            this._status = SocketStatus.OPEN
            this.emit("open", event)
            this.drain()
        }
    }
    async push(data: string, options?: any) {
        if (this._status === SocketStatus.OPEN) {
            return await $fetch("/sse/put", {
                method: "POST",
                body: data,
                ...options
            }).then((_response: any) => {
                return true;
            }).catch(error => {
                console.error("Error", error)
                return false;
            })
        } else {
            this._backpressure.push(data)
        }
    }
    private drain() {
        this._backpressure.forEach(data => {
            this.push(data)
        })
        this._backpressure = []
    }
    get status() {
        return this._status
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
        this.emit("close", null)
    }
    get value() {
        return this.eventSource
    }
    get type() {
        return "Server Side Events"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    get events() {
        return this._events
    }
    set backpressure(_backpressure: any[]) {
        this._backpressure = _backpressure
    }
    get backpressure() {
        return this._backpressure
    }
    [Symbol.dispose]() {
        this.eventSource.close()
    }
}


class Poll implements _RealTime {
    private _events: Record<Events, Array<(data: any) => void>>;
    private _history: Record<Events, any>;
    private _status: SocketStatus = SocketStatus.CLOSED
    private _backpressure: any[] = []
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
                var response = parseData(_response)
                if (Array.isArray(response)) {
                    response.forEach(data => this.emit("data", parseData(data)))
                } else {
                    this.emit("data", response)
                }
            }).catch(error => {
                console.error("Pull Poll Error", error)
                this.emit("error", error)
                this._status = SocketStatus.UNKNOWN
            })
        }, this.intervalTime)
        this.emit("open", null)
        this._status = SocketStatus.OPEN
        this.drain()
    }
    async push(data: string, options?: any) {
        return await $fetch("/poll/put", {
            method: "POST",
            body: data,
            ...options
        }).then(response => {
            return response;
        }).catch(error => {
            consola.error("Upload Poll Error", error)
            return false;
        })
    }
    private drain() {
        this._backpressure.forEach(data => {
            this.push(data)
        })
        this._backpressure = []
    }
    get status() {
        return this._status
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
    get type() {
        return "Long Polling"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    set backpressure(_backpressure: any[]) {
        this._backpressure = _backpressure
    }
    get events() {
        return this._events
    }
    get backpressure() {
        return this._backpressure
    }
    [Symbol.dispose]() {
        clearInterval(this.interval)
    }
}

class WS implements _RealTime {
    private ws: WebSocket
    _events: Record<Events, Array<(data: any) => void>>;
    private _backpressure: any[] = []
    private _status: SocketStatus = SocketStatus.CLOSED
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
            const data = parseData(event.data)
            this.emit("data", data)
        }
        this.ws.onerror = (event) => {
            this.emit("error", event)
        }
        this.ws.onopen = (event) => {
            this.emit("open", event)
            this._status = SocketStatus.OPEN
            this.drain()
        }
        this.ws.onclose = (event) => {
            this.emit("close", event)
        }
    }
    get status() {
        return this._status
    }
    private drain() {
        this._backpressure.forEach(data => {
            this.push(data)
        })
        this._backpressure = []
    }
    async push(data: string, options?: any) {
        if (this._status === SocketStatus.OPEN) {
            this.ws.send(data)
            return Promise.resolve(true)
        } else {
            this._backpressure.push(data)
            return Promise.resolve(false)
        }
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
    get type() {
        return "WebSocket"
    }
    set events(_events: Record<Events, Array<(data: any) => void>>) {
        this._events = _events
    }
    set backpressure(_backpressure: any[]) {
        this._backpressure = _backpressure
    }
    get backpressure() {
        return this._backpressure
    }
    get events() {
        return this._events
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
    private _status: SocketStatus = SocketStatus.CLOSED;
    constructor() {
        if (!process.client) return
        this.init()
    }

    private init(priority = 1) {
        switch (priority) {
            case 1:
                var rt = new WS() as _RealTime
                break
            case 2:
                var rt = new SSE() as _RealTime
                break
            case 3:
                var rt = new Poll() as _RealTime
                break
            default:
                throw new Error("Invalid priority")
        }
        this.syncData(rt)
        this.current = {
            type: rt.type,
            value: rt,
            priority: priority
        }
        rt.on("open", () => {
            this.status = SocketStatus.OPEN
            consola.success("RealTime connection established via", rt.type)
        })
        rt.on("close", () => {
            this.status = SocketStatus.CLOSED
            this.retry()
        })
        rt.on("error", (error: Error) => {
            this.status = SocketStatus.UNKNOWN
            this.handleError(error)
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
            } else {
                this.current!.value?.close()
                if (this.current!.priority === 3) {
                    clearInterval(interval)
                    console.error("All RealTime connections failed: Stopped")
                } else {
                    console.warn("Retrying with the next priority", this.current!.priority + 1)
                    this.init(this.current!.priority + 1)
                }
            }
        }, intervalSeconds * 1000)
    }

    push(data: unknown) {
        if (this.status !== SocketStatus.OPEN) {
            this.current!.value.backpressure.push(data)
        }
        if (typeof data !== "string") {
            var _data = JSON.stringify(data)
        } else {
            var _data = data
        }
        this.current!.value.push(_data)
    }

    private syncData(target: _RealTime) {
        target.events = this.current?.value.events || {
            data: [],
            error: [],
            open: [],
            close: [],
        }
        target.backpressure = this.current?.value.backpressure || []
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

    close() {
        this.current?.value.close()
    }
}

export function isSocketTemplate(data: any): data is SocketTemplate {
    return (data as SocketTemplate)?.type !== undefined
}


export function parseData(data: any): SocketTemplate {
    if (typeof data === "string") {
        try {
            return JSON.parse(data)
        } catch (error) {
            consola.error("Error parsing data", error)
            return data as unknown as SocketTemplate
        }
    } else {
        return data
    }
}