import {
    randomBytes,
    pbkdf2Sync
} from "node:crypto"

export function hashPassword(password: string): `${string}.${string}` {
    const salt = randomBytes(16).toString('hex')
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return `${hash}.${salt}`
}

export function verifyPassword(password: string, check: string): boolean {
    const [hash, salt] = check.split('.')
    const verify = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return verify === hash
}