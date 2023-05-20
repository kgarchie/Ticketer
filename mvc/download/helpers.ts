import path from "path";
import fs from "fs";

export function readFilesFromStorage(user_id:string, chat_id:string, filename:string){
    const constructed_path = path.join(process.cwd(), "public", "uploads", user_id, chat_id, filename)
    try{
        return fs.createReadStream(constructed_path);
    } catch (e) {
        console.log(e);
        return null;
    }
}