import { TYPE, type SocketTemplate } from "~/types"

export default defineNuxtPlugin(app => {
    const socket = useSocket()
    const user = useUser().value
    if (socket.value) return
    
    const realTime = new RealTime()
    // @ts-ignore
    socket.value = realTime

    if (user.user_id) {
        realTime.on("data", (_data: any) => {
            const data = parseData(_data)
            if (!isSocketTemplate(data)) return
            switch (data?.type) {
                case TYPE.AUTH_REQ:
                    realTime.push({
                        statusCode: 200,
                        type: TYPE.AUTH_RES,
                        body: user.user_id
                    } satisfies SocketTemplate)
                    break
                case TYPE.IDENTITY:
                    useCookie("X-Request-Id", data.body)
                    break
            }
        })
    } else {
        console.warn("User not identified. Cannot authenticate socket")
    }
})