export default defineEventHandler(async (event) => {
    new SseClient(event)
    // do not return anything
})