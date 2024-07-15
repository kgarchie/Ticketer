export default defineNuxtPlugin(app => {
    const socket = useSocket()
    if(socket.value) return
    const realTime = new RealTime()
    socket.value = realTime
})