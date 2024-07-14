export default defineEventHandler(async event => {
    new PollClient(event)
    // do not return anything
})