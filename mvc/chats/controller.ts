import {createRouter, defineEventHandler} from "h3";
import {getChats, readMessage, sendMessage} from "~/mvc/chats/model";
import multer from "multer";

const router = createRouter();

router.post('/', defineEventHandler(async (event) => {
        return await getChats(event)
    }
));

router.post('/messages/send', defineEventHandler(async (event) => {
        return await sendMessage(event)
    }
));

router.post('/messages/read', defineEventHandler(async (event) => {
        return await readMessage(event)
    }
));

router.post('/messages', defineEventHandler(async (event) => {
        return
    }
));

export default useBase('/api/chats', router.handler)