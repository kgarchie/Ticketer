export default defineEventHandler(async event => {
    const client = new SseClient(event)
    const data = await readBody(event)
    client.emit("data", data)
    return {
        statusCode: 201,
        body: "Created"
    }
})