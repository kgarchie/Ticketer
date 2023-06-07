import {
    fileExists,
    getOldestUnpurgedAttachments,
    storeLocation,
    addToPurge,
    getPurgeList,
    deletePurgeItem,
    getTotalAttachmentsSize
} from "~/mvc/chats/queries";
import { minioClient, bucketName } from "~/minioClient";
import { Float } from "type-fest";

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


    if (!minioClient || !bucketName) {
        throw new Error("Minio client not initialized")
    }

    getTotalAttachmentsSize((totalSize:Float<number>) => {
        if (totalSize >= targetSize) {
            startPurge()
        }
    })

    return minioClient.fPutObject(bucketName, fullyQualifiedUrl, file.filepath)
        .then((uploadedInfo) => {
            if (!uploadedInfo) return console.error("Error uploading file")
            storeLocation(fullyQualifiedUrl, messageId, file.size, uploadedInfo)
        }).catch((err) => {
            minioClient!.removeIncompleteUpload(bucketName!, fullyQualifiedUrl, function (err) {
                if (err) return console.log(err)
            })
            schedulePurge()
            throw err
        })
}

export async function getPresignedUrl(fullyQualifiedUrl: string | null) {
    if (!minioClient || !bucketName) {
        throw new Error("Minio client not initialized")
    }

    if (!fullyQualifiedUrl) return null

    const expiry = 24 * 60 * 60 * Number(process.env.PRESIGNED_LINK_EXPIRY) || 24 * 60 * 60 * 7

    return new Promise<string>((resolve, reject) => {
        minioClient!.presignedUrl('GET', bucketName!, fullyQualifiedUrl, expiry, function (err, presignedUrl) {
            if (err) reject(err);
            resolve(presignedUrl);
        });
    })
}

async function schedulePurge(totalSize: Float<number> = 0.0): Promise<null | void> {
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
        minioClient!.removeObject(bucketName!, attachment.url, function (err) {
            if (err) return console.log(err)
        })
        await deletePurgeItem(attachment.id)
    }
}