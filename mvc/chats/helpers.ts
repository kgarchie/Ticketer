import {
    fileExists,
    getOldestUnpurgedAttachments,
    storeLocation,
    addToPurge,
    getPurgeList,
    deletePurgeItem,
    getTotalAttachmentsSize
} from "~/mvc/chats/queries";
import type { Float } from "type-fest";
import fileStorage from "~/filestorage";

const targetSizeInGB = process.env.TARGET_SIZE || "3"
const targetSize = parseInt(targetSizeInGB) * 1024 * 1024 * 1024

export function obtainChat_id(from_user_id: string, to_user_id: string) {
    const users = [from_user_id, to_user_id].sort((a, b) => a.localeCompare(b))
    return users[0] + users[1]
}


export async function writeFileToStorage(constructed_path: string, file: any, messageId: number) {
    let fullyQualifiedUrl = `${constructed_path}/${file.originalFilename.replace(/ /g, "_")}`

    if (await fileExists(fullyQualifiedUrl)) {
        let fileName = file.originalFilename.split(".")
        let fileExtension = fileName.pop()
        let fileNameWithoutExtension = fileName.join(".") || "unknown"
        let addon = new Date().toISOString().replace(/:/g, "-")
        fullyQualifiedUrl = `${constructed_path}/${fileNameWithoutExtension}_${addon}.${fileExtension}`
    }

    getTotalAttachmentsSize((totalSize: Float<number>) => {
        if (totalSize >= targetSize) {
            startPurge()
        }
    })

    return fileStorage
        .setItemRaw(fullyQualifiedUrl, file)
        .then(() => storeLocation(fullyQualifiedUrl, messageId, file.size))
        .catch(err => {
            console.error(err)
            schedulePurge()
        })
}

export async function getPresignedUrl(fullyQualifiedUrl: string | null) {
    if (!fullyQualifiedUrl) return null
    return await fileStorage.getItem(fullyQualifiedUrl).catch(console.error)
}

async function schedulePurge(totalSize: number = 0.0): Promise<null | void> {
    let batch = await getOldestUnpurgedAttachments(100)

    for (const attachment of batch) {
        totalSize += attachment.size
        if (totalSize >= targetSize) {
            return null
        }
        addToPurge(attachment.id)
    }

    return await schedulePurge(totalSize)
}

async function startPurge() {
    const discard = await getPurgeList()
    for (const attachment of discard) {
        await fileStorage.removeItem(attachment.attachment.url)
        await deletePurgeItem(attachment.id)
    }
}