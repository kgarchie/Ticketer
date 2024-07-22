import { createStorage, defineDriver } from "unstorage";
import { existsSync, watch } from "fs";
import { readFile, writeFile, rename, unlink, readdir, lstat, mkdir } from "fs/promises";
import { join, resolve, sep } from "pathe";
import type { WatchEventType } from "node:fs";

const customDriver = defineDriver((options?: { destination: string }) => {
    if (!options || !options.destination) {
        options = { destination: './' }
    }
    const location = (destination: string) => {
        const basePath = join("public", "uploads", options!.destination, destination).replace(/:/g, sep)
        return resolve(basePath)
    }

    return {
        name: "custom-driver",
        options,
        hasItem(key, _opts) {
            return existsSync(location(key))
        },
        async getItem(key, _opts) {
            return await readFile(location(key))
        },
        async setItem(key, value: File | string, _opts) {
            const fileLocation = location(key)
            if (!existsSync(fileLocation)) {
                const folder = fileLocation.split(sep).slice(0, -1).join(sep)
                await mkdir(folder, { recursive: true })
            }

            if (value instanceof File) {
                await rename(value.filepath, fileLocation)
                return fileLocation
            } else {
                await writeFile(fileLocation, value)
                return fileLocation
            }
        },
        async setItemRaw(key, value, _opts) {
            const folder = location(key).split(sep).slice(0, -1).join(sep)
            if(!existsSync(folder)){
                await mkdir(folder, { recursive: true })
            }
            return await rename(value.filepath, location(key))
        },
        async removeItem(key, _opts) {
            return await unlink(location(key))
        },
        async getKeys(base, _opts) {
            async function construct(location: string, sb: string) {
                const stats = await lstat(location).catch(e => null)
                if (stats?.isDirectory()) {
                    const next = await readdir(location)
                    return construct(next[0], join(sb, location))
                }

                return join(sb, location)
            }

            const files = await readdir(join(options!.destination, "public", "uploads")).catch(e => {
                console.error(e)
                return []
            })

            const keys: string[] = []
            for (const file of files) {
                construct(file, join(options!.destination, "public", "uploads")).then(value => {
                    keys.push(value)
                })
            }

            return keys
        },
        async clear(base, _opts) {
            async function deleteFiles(directory: string) {
                if (!existsSync(directory)) return

                const files = await readdir(directory)

                for (const file of files) {
                    const stats = await lstat(file).catch(e => null)
                    if (stats?.isDirectory()) {
                        deleteFiles(file)
                    }

                    unlink(file)
                }
            }

            return await deleteFiles(join(options!.destination, "public", "uploads"))
        },
        async dispose() {
        },
        async watch(callback: (event: WatchEventType, filename: string | null) => void) {
            const watcher = watch(join(options!.destination, "public", "uploads"), { recursive: true }, (event, filename) => {
                callback(event, filename)
            })

            return () => {
                watcher.close()
            }
        },
    };
});

const imageStorage = createStorage({
    driver: customDriver(undefined)
})

export default imageStorage;