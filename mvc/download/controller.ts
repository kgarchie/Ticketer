import {createRouter, defineEventHandler} from "h3";
import {getFiles} from "~/mvc/download/functions";

const router = createRouter();

router.get('/:user_id/:chat_id/:filename', defineEventHandler(async (event) => {
        return await getFiles(event)
}));

export default useBase('/api/download', router.handler)