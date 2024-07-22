"use strict";
var TYPE;
(function (TYPE) {
    TYPE["MESSAGE"] = "MESSAGE";
    TYPE["NOTIFICATION"] = "NOTIFICATION";
    TYPE["NEW_MESSAGE_NOTIFICATION"] = "NEW_MESSAGE_NOTIFICATION";
    TYPE["AUTH_REQ"] = "AUTH_REQ";
    TYPE["AUTH_RES"] = "AUTH_RES";
    TYPE["HEARTBEAT"] = "heartbeat";
    TYPE["DELETE_COMMENT"] = "delete comment";
    TYPE["ERROR"] = "error";
    TYPE["STATUS"] = "status";
    TYPE["TAGGED"] = "tagged";
    TYPE["NEW_COMMENT"] = "new comment";
    TYPE["NEW_TICKET"] = "new ticket";
    TYPE["UPDATE_TICKET"] = "update ticket";
    TYPE["DELETE_TICKET"] = "delete ticket";
    TYPE["CALL"] = "call";
    TYPE["CALL_SDP"] = "call sdp";
    TYPE["CLOSE_SOCKET"] = "close socket";
    TYPE["PING"] = "ping";
    TYPE["PONG"] = "pong";
    TYPE["IDENTITY"] = "IDENTITY";
})(TYPE || (TYPE = {}));
var SocketStatus;
(function (SocketStatus) {
    SocketStatus["OPEN"] = "OPEN";
    SocketStatus["CLOSED"] = "CLOSED";
    SocketStatus["UNKNOWN"] = "UNKNOWN";
    SocketStatus["CONNECTING"] = "CONNECTING";
})(SocketStatus || (SocketStatus = {}));
class _RealTime {
    push(data) { }
    setup() { }
    on(event, callback) { }
    emit(event, data) { }
    close() { }
    get value() { return null; }
    get type() { return "RealTime"; }
    set events(events) { }
    get events() { return { data: [], error: [], open: [], close: [] }; }
    set backpressure(data) { }
    get status() { return SocketStatus.CLOSED; }
    get backpressure() { return []; }
}
class SSE {
    constructor() {
        this._backpressure = [];
        this._status = SocketStatus.CLOSED;
        const eventSource = new EventSource("/sse/get");
        this.eventSource = eventSource;
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this.setup();
    }
    setup() {
        this.eventSource.onmessage = (event) => {
            const data = parseData(event.data);
            this.emit("data", data);
        };
        this.eventSource.onerror = (event) => {
            this.emit("error", event);
            this._status = SocketStatus.UNKNOWN;
        };
        this.eventSource.onopen = (event) => {
            this._status = SocketStatus.OPEN;
            this.emit("open", event);
            this.drain();
        };
    }
    async push(data, options) {
        if (this._status === SocketStatus.OPEN) {
            return await fetch("/sse/put", Object.assign({ method: "POST", body: data }, options)).then((_response) => {
                return true;
            }).catch(error => {
                console.error("Error", error);
                return false;
            });
        }
        else {
            this._backpressure.push(data);
        }
    }
    drain() {
        this._backpressure.forEach(data => {
            this.push(data);
        });
        this._backpressure = [];
    }
    get status() {
        return this._status;
    }
    on(event, callback) {
        this._events[event].push(callback);
        this._history[event].forEach(callback);
    }
    emit(event, data) {
        this._events[event].forEach(callback => callback(data));
        this._history[event].push(data);
    }
    close() {
        this.eventSource.close();
        this.emit("close", null);
    }
    get value() {
        return this.eventSource;
    }
    get type() {
        return "Server Side Events";
    }
    set events(_events) {
        this._events = _events;
    }
    get events() {
        return this._events;
    }
    set backpressure(_backpressure) {
        this._backpressure = _backpressure;
    }
    get backpressure() {
        return this._backpressure;
    }
}
class Poll {
    constructor() {
        this._status = SocketStatus.CLOSED;
        this._backpressure = [];
        this.intervalTime = 1000 * 5; // 5 seconds
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this.setup();
    }
    setup() {
        this.interval = setInterval(async () => {
            await fetch("/poll/get", {
                method: "GET"
            }).then(async (_response) => {
                var response = await _response.json();
                response = parseData(response);
                if (Array.isArray(response)) {
                    response.forEach(data => this.emit("data", parseData(data)));
                }
                else {
                    this.emit("data", response);
                }
            }).catch(error => {
                console.error("Pull Poll Error", error);
                this.emit("error", error);
                this._status = SocketStatus.UNKNOWN;
            });
        }, this.intervalTime);
        this.emit("open", null);
        this._status = SocketStatus.OPEN;
        this.drain();
    }
    async push(data, options) {
        return await fetch("/poll/put", Object.assign({ method: "POST", body: data }, options)).then(async (response) => {
            return await response.json();
        }).catch(error => {
            console.error("Upload Poll Error", error);
            return false;
        });
    }
    drain() {
        this._backpressure.forEach(data => {
            this.push(data);
        });
        this._backpressure = [];
    }
    get status() {
        return this._status;
    }
    on(event, callback) {
        this._events[event].push(callback);
        this._history[event].forEach(callback);
    }
    emit(event, data) {
        this._events[event].forEach(callback => callback(data));
        this._history[event].push(data);
    }
    close() {
        clearInterval(this.interval);
    }
    get value() {
        return null;
    }
    get type() {
        return "Long Polling";
    }
    set events(_events) {
        this._events = _events;
    }
    set backpressure(_backpressure) {
        this._backpressure = _backpressure;
    }
    get events() {
        return this._events;
    }
    get backpressure() {
        return this._backpressure;
    }
}
class WS {
    constructor() {
        this._backpressure = [];
        this._status = SocketStatus.CLOSED;
        const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
        this.ws = ws;
        this._events = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this._history = {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        this.setup();
    }
    setup() {
        this.ws.onmessage = (event) => {
            const data = parseData(event.data);
            this.emit("data", data);
        };
        this.ws.onerror = (event) => {
            this.emit("error", event);
        };
        this.ws.onopen = (event) => {
            this.emit("open", event);
            this._status = SocketStatus.OPEN;
            this.drain();
        };
        this.ws.onclose = (event) => {
            this.emit("close", event);
        };
    }
    get status() {
        return this._status;
    }
    drain() {
        this._backpressure.forEach(data => {
            this.push(data);
        });
        this._backpressure = [];
    }
    async push(data, options) {
        if (this._status === SocketStatus.OPEN) {
            this.ws.send(data);
            return Promise.resolve(true);
        }
        else {
            this._backpressure.push(data);
            return Promise.resolve(false);
        }
    }
    on(event, callback) {
        this._events[event].push(callback);
        this._history[event].forEach(callback);
    }
    emit(event, data) {
        this._events[event].forEach(callback => callback(data));
        this._history[event].push(data);
    }
    close() {
        this.ws.close();
    }
    get value() {
        return this.ws;
    }
    get type() {
        return "WebSocket";
    }
    set events(_events) {
        this._events = _events;
    }
    set backpressure(_backpressure) {
        this._backpressure = _backpressure;
    }
    get backpressure() {
        return this._backpressure;
    }
    get events() {
        return this._events;
    }
}
class RealTime {
    constructor() {
        this.current = null;
        this._status = SocketStatus.CLOSED;
        this.init();
    }
    init(priority = 1) {
        switch (priority) {
            case 1:
                var rt = new WS();
                break;
            case 2:
                var rt = new SSE();
                break;
            case 3:
                var rt = new Poll();
                break;
            default:
                throw new Error("Invalid priority");
        }
        this.syncData(rt);
        this.current = {
            type: rt.type,
            value: rt,
            priority: priority
        };
        rt.on("open", () => {
            this.status = SocketStatus.OPEN;
            console.info("RealTime connection established via", rt.type);
        });
        rt.on("close", () => {
            this.status = SocketStatus.CLOSED;
            this.retry();
        });
        rt.on("error", (error) => {
            this.status = SocketStatus.UNKNOWN;
            this.handleError(error);
        });
    }
    handleError(error) {
        console.error("Error", error);
        console.info("Retrying with the next priority");
        if (this.status === SocketStatus.CONNECTING)
            return;
        this.retry(0);
    }
    retry(intervalSeconds = 4) {
        this.status = SocketStatus.CONNECTING;
        const interval = setInterval(() => {
            var _a;
            if (this.status === SocketStatus.OPEN) {
                clearInterval(interval);
            }
            else {
                (_a = this.current.value) === null || _a === void 0 ? void 0 : _a.close();
                if (this.current.priority === 3) {
                    clearInterval(interval);
                    console.error("All RealTime connections failed: Stopped");
                }
                else {
                    console.warn("Retrying with the next priority", this.current.priority + 1);
                    this.init(this.current.priority + 1);
                }
            }
        }, intervalSeconds * 1000);
    }
    push(data) {
        if (this.status !== SocketStatus.OPEN) {
            this.current.value.backpressure.push(data);
        }
        if (typeof data !== "string") {
            var _data = JSON.stringify(data);
        }
        else {
            var _data = data;
        }
        this.current.value.push(_data);
    }
    syncData(target) {
        var _a, _b;
        target.events = ((_a = this.current) === null || _a === void 0 ? void 0 : _a.value.events) || {
            data: [],
            error: [],
            open: [],
            close: [],
        };
        target.backpressure = ((_b = this.current) === null || _b === void 0 ? void 0 : _b.value.backpressure) || [];
    }
    on(event, callback) {
        this.current.value.on(event, callback);
    }
    get value() {
        return this.current.value;
    }
    get status() {
        return this._status;
    }
    set status(status) {
        this._status = status;
    }
    close() {
        var _a;
        (_a = this.current) === null || _a === void 0 ? void 0 : _a.value.close();
    }
}
function isSocketTemplate(data) {
    return (data === null || data === void 0 ? void 0 : data.type) !== undefined;
}
function parseData(data) {
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        }
        catch (error) {
            console.error("Error parsing data", error);
            return data;
        }
    }
    else {
        return data;
    }
}

async function setCookie(name, value) {
    await cookieStore.set({
        name: name,
        value: value
    });
}

async function getCookie(name, json = false) {
    const cookie = await cookieStore.get(name);
    if (!cookie) return json ? {} : null
    try {
        return json ? JSON.parse(cookie.value) : cookie.value
    } catch (_) {
        return cookie.value
    }
}

function showNotification(title, body, action) {
    if (Notification.permission === "granted") {
        self.registration.showNotification(title, {
            body: body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            click_action: action,
        }).then((r) => console.log(r));
    }
}

self.addEventListener("install", () => {
    console.log("Service worker installed")
})

self.addEventListener("activate", async () => {
    const realTime = new RealTime()
    const user = await getCookie("auth", true)
    realTime.on("data", (_data) => {
        const data = parseData(_data)
        switch (data.type) {
            case TYPE.AUTH_REQ:
                realTime.push({
                    statusCode: 200,
                    type: TYPE.AUTH_RES,
                    body: user?.user_id
                })
                break
            case TYPE.IDENTITY:
                setCookie("X-Request-Id", data.body)
                break
            case TYPE.MESSAGE:
                showNotification(data.body.fromUserName, data.body.message.message || "Attachment", location.origin)
                break
            case TYPE.NOTIFICATION:
            case TYPE.NEW_MESSAGE_NOTIFICATION:
                showNotification(data.body, location.origin)
                break
        }
    })
})