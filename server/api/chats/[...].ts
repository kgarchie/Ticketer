import chatsController from '~/mvc/chats/controller'
export default defineEventHandler(async (event) => {
    return chatsController(event)
});
