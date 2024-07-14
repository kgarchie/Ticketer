export default defineEventHandler(async event => {
    const client = new PollClient(event)
    const data = await readBody(event)
    client.emit("data", data)
    return {
        statusCode: 201,
        body: "Created"
    }
})