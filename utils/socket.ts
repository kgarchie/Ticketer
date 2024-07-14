type Events = "data" | "error" | "open" | "close"
abstract class RealTime {
    push(data: any) { }
    setup() { }
    on(event: Events, callback: Function) { }
    emit(event: Events, data: any) { }
    get value(): any { return null }
    get type(): string { return "RealTime" }
}

export class SSE implements RealTime {
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
    get value() {
        return this.eventSource
    }
    get type() {
        return "SSE"
    }
    [Symbol.dispose]() {
        this.eventSource.close()
    }
}


export class Poll implements RealTime {
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
            await $fetch("/poll/get", {
                method: "GET"
            }).then(response => {
                console.log("Response", response)
                this.emit("data", response)
            }).catch(error => {
                console.error("Error", error)
                this.emit("error", error)
            })
        }, this.intervalTime)
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
    get value() {
        return null
    }
    get type() {
        return "Poll"
    }
    [Symbol.dispose]() {
        clearInterval(this.interval)
    }
}

export class WS implements RealTime {
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
            this.emit("data", event.data)
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
    get value() {
        return this.ws
    }
    get type() {
        return "WS"
    }
    [Symbol.dispose]() {
        this.ws.close()
    }   
}