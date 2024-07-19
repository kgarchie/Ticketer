import { SocketStatus } from "~/types"

export default defineEventHandler(async event => {
    new PollClient(event, SocketStatus.CLOSED)
})