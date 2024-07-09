// @ts-ignore
import {createRouter, type H3Event} from "h3";
import {getChats, readMessage, sendMessage, placeCall, acceptCall, rejectCall, getFileUrl} from "~/mvc/chats/functions";

const router = createRouter();

router.get('/', defineEventHandler(async (event: H3Event<Request>) => {
        return await getChats(event)
    }
));

router.post('/messages/send', defineEventHandler(async (event: H3Event<Request>) => {
        return await sendMessage(event)
    }
));

router.post('/messages/attachment', defineEventHandler(async (event: H3Event<Request>) => {
        return await getFileUrl(event)
}));

router.post('/call', defineEventHandler(async (event: H3Event<Request>) => {
        return await placeCall(event)
    }
));

router.post('/call/accept', defineEventHandler(async (event: H3Event<Request>) => {
        return await acceptCall(event)
    }
));

router.post('/call/reject', defineEventHandler(async (event: H3Event<Request>) => {
        return await rejectCall(event)
}));

router.post('/messages/read', defineEventHandler(async (event: H3Event<Request>) => {
        return await readMessage(event)
    }
));

router.post('/messages', defineEventHandler(async (event: H3Event<Request>) => {
        return
    }
));

export default useBase('/api/chats', router.handler)