import {H3Event} from "h3";
import {readFilesFromStorage} from "~/mvc/download/helpers";

export async function getFiles(event: H3Event) {
    const {user_id, chat_id, filename} = event.context.params || {};

    if (!user_id || !chat_id || !filename) {
        return null
    }

    return readFilesFromStorage(user_id, chat_id, filename);
}