export function obtainChat_id(from_user_id: string, to_user_id: string) {
    const users = [from_user_id, to_user_id].sort((a, b) => a.localeCompare(b))
    return users[0] + users[1]
}