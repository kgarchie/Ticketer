import filestorage from "~/filestorage"
import { createReadStream } from "fs";

type FileInfo = {
    size: number;
    filepath: string;
    newFilename: string;
    mimetype: string;
    mtime: string;
    originalFilename: string;
};

export default defineEventHandler(async event => {
    const url = event.context.params?.url
    if (!url) {
        return new Response(null, { status: 404 })
    }
    const _file = await filestorage.getItem(url) as any | null
    if (!_file) {
        return new Response(null, { status: 404 })
    }

    try {
        var file = JSON.parse(new TextDecoder().decode(_file))
    } catch (_) {
        file = _file
    }

    function isStats(file: any): file is FileInfo {
        return file.filepath && file.size && file.newFilename && file.mimetype && file.mtime && file.originalFilename
    }

    if (isStats(file)) {
        const fileStream = createReadStream(file.filepath)
        const webStream = new ReadableStream({
            start(controller) {
                fileStream.on("data", chunk => controller.enqueue(chunk))
                fileStream.on("end", () => controller.close())
                fileStream.on("error", error => controller.error(error))
            }
        })
        const headers = new Headers({
            "Content-Type": file.mimetype,
            "Content-Length": file.size.toString(),
            "Content-Disposition": `attachment; filename="${file.originalFilename}"`,
            "Last-Modified": file.mtime
        })
        return new Response(webStream, { status: 200, headers })
    } else {
        return new Response(file)
    }
})