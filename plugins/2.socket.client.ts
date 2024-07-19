import { TYPE, type SocketTemplate } from "~/types"

export default defineNuxtPlugin(app => {
    const socket = useSocket()
    const user = useUser().value
    if (socket.value) return
    const realTime = new RealTime()
    socket.value = realTime

    if (user.user_id) {
        realTime.on("data", (data) => {
            const { data: _data } = parseData(data)
            console.log(_data)
            if (!isSocketTemplate(_data)) return
            switch (_data.type) {
                case TYPE.AUTH_REQ:
                    realTime.push({
                        statusCode: 200,
                        type: TYPE.AUTH_RES,
                        body: user.user_id
                    } satisfies SocketTemplate)
                    break
            }
        })
    } else {
        console.warn("User not identified. Cannot authenticate socket")
    }
})