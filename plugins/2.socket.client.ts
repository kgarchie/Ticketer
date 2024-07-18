import { TYPE, type SocketTemplate } from "~/types"

export default defineNuxtPlugin(app => {
    const socket = useSocket()
    const user = useUser().value
    if(socket.value) return
    const realTime = new RealTime()
    socket.value = realTime

    if(user.user_id) {
        realTime.push({
            statusCode: 200,
            type: TYPE.AUTH,
            body: user.user_id
        } satisfies SocketTemplate)
    } else {
        console.warn("User not identified. Cannot authenticate socket")
    }

    realTime.on("data", (data) => {
        try {
            var response = JSON.parse(data) as SocketTemplate
        } catch (error) {
            var response = data as SocketTemplate
        }

        switch (response?.type) {
            case TYPE.DETAILS_RES:
                useCookie("X-Request-Id").value = response.body
            break
        }
    })
})