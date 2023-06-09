import {createRouter, defineEventHandler} from "h3";
import {getChats, readMessage, sendMessage, placeCall, acceptCall, rejectCall, getFileUrl} from "~/mvc/chats/functions";

const router = createRouter();

router.post('/', defineEventHandler(async (event) => {
        return await getChats(event)
    }
));

router.post('/messages/send', defineEventHandler(async (event) => {
        return await sendMessage(event)
    }
));

router.post('/messages/attachment', defineEventHandler(async (event) => {
        return await getFileUrl(event)
}));

router.post('/call', defineEventHandler(async (event) => {
        return await placeCall(event)
    }
));

router.post('/call/accept', defineEventHandler(async (event) => {
        return await acceptCall(event)
    }
));

router.post('/call/reject', defineEventHandler(async (event) => {
        return await rejectCall(event)
}));

router.post('/messages/read', defineEventHandler(async (event) => {
        return await readMessage(event)
    }
));

router.post('/messages', defineEventHandler(async (event) => {
        return
    }
));

export default useBase('/api/chats', router.handler)