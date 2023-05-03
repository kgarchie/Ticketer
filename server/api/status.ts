import { ServerStatus } from "~/types"

export default defineEventHandler(() => {
    return {
        statusCode: 200,
        body: ServerStatus.UP
    }
})