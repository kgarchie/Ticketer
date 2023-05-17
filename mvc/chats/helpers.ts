import * as fs from "fs";
import path from "path";

export function obtainChat_id(from_user_id: string, to_user_id: string) {
    const users = [from_user_id, to_user_id].sort((a, b) => a.localeCompare(b))
    return users[0] + users[1]
}


export function writeFileToStorage(given_path: string, locationsOnDisk: string[], file:any) {
    // TODO: Find a better way of serving static files in nuxt3 instead of using public folder
    // let root = `/public/uploads/${path}`
    let dirName = path.resolve(path.dirname(''))
    let cwd = process.cwd()
    // console.log("cwd: ", cwd)

    while (!dirName.endsWith("public")) {
        dirName = dirName.substring(0, dirName.lastIndexOf("\\"))

        if (dirName.length === 0) {
            dirName = cwd
            dirName += "/public"
            break
        }
    }

    let root = `${dirName}/uploads/${given_path}`
    let dir = `uploads/${given_path}`

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root, {recursive: true})
    }

    let fullyQualifiedUrl = `${dir}/${file.originalFilename.replace(/ /g, "_")}`
    let fullyQualifiedPath = `${root}/${file.originalFilename.replace(/ /g, "_")}`

    // TODO: Find a better way of handling file name collisions, like fs.promises.access
    if (fs.existsSync(fullyQualifiedUrl)) {
        let fileName = file.originalFilename.split(".")
        let fileExtension = fileName.pop()
        let fileNameWithoutExtension = fileName.join(".")
        let counter = 1

        while (fs.existsSync(`${root}/${fileNameWithoutExtension}_${counter}.${fileExtension}`)) {
            counter++
        }

        fullyQualifiedUrl = `${dir}/${fileNameWithoutExtension}_${counter}.${fileExtension}`
        fullyQualifiedPath = `${root}/${fileNameWithoutExtension}_${counter}.${fileExtension}`
    }

    locationsOnDisk.push(fullyQualifiedUrl)

    return new Promise((resolve, reject) => {
        fs.rename(file.filepath, fullyQualifiedPath, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(true)
            }
        })
    })
}