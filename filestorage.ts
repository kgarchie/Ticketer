import { createStorage, defineDriver, type StorageValue as _StorageValue } from "unstorage";
import { existsSync, watch } from "fs";
import { readFile, writeFile, rename, unlink, readdir, lstat } from "fs/promises";
import path from "path";

const customDriver = defineDriver((options?: { destination: string }) => {
    if (!options || !options.destination) {
        options = { destination: './' }
    }
    const location = (destination: string) => path.join(options.destination, destination)

    return {
        name: "custom-driver",
        options,
        hasItem(key, _opts) {
            return existsSync(location(key))
        },
        async getItem(key, _opts) {
            return await readFile(location(key))
        },
        async setItem(key, value, _opts) {
            if (existsSync(value)) {
                return await rename(value, location(key))
            } else {
                return await writeFile(location(key), value)
            }
        },
        async setItemRaw(key, value, _opts) {
            return await rename(value.filePath, location(key))
        },
        async removeItem(key, _opts) {
            return await unlink(location(key))
        },
        async getKeys(base, _opts) {
            async function construct(location: string, sb: string) {
                const stats = await lstat(location).catch(e => null)
                if (stats?.isDirectory()) {
                    const next = await readdir(location)
                    return construct(next[0], path.join(sb, location))
                }

                return path.join(sb, location)
            }

            const files = await readdir(options.destination).catch(e => {
                console.error(e)
                return []
            })

            const keys: string[] = []
            for (const file of files) {
                construct(file, options.destination).then(value => {
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
                    if (stats && stats.isDirectory()) {
                        deleteFiles(file)
                    }

                    unlink(file)
                }
            }

            return await deleteFiles(options.destination)
        },
        async dispose() { },
        async watch(callback) {
            const watcher = watch(options.destination, { recursive: true }, (event, filename) => {
                (event as any, filename)
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