import prisma from "~/db";

export async function getAdmins() {
    return await prisma.user.findMany({
        where: {
            is_admin: true
        },
        select: {
            name: true,
            email: true,
            company: true,
            is_admin: true,
            user_id: true,
            password: false
        }
    }).catch(
        (error) => {
            console.log(error);
            return []
        }
    )
}

export async function getUserOrEphemeralUser_Secure(user_id: string | undefined) {
    return await prisma.user.findUnique({
        where: {
            user_id: user_id
        },
        select: {
            name: true,
            email: true,
            company: true,
            is_admin: true,
            user_id: true
        }
    }) || await prisma.ephemeralUser.findUnique({
        where: {
            user_id: user_id
        }
    }).then(
        (data: any) => {
            return {
                ...data,
                name: 'Anonymous',
                email: 'Anonymous',
                company: 'Anonymous',
                is_admin: false,
                user_id: user_id
            }
        }
    ) || null
}

export async function getUserName(user_id: string) {
    const user = await getUserOrEphemeralUser_Secure(user_id)

    if (user) {
        return user.name
    } else {
        return user_id
    }
}

export async function getUserNameOrUser_Id(user_id: string | null) {
    const user = await getUserOrEphemeralUser_Secure(user_id!)

    if (user.name !== 'Anonymous') {
        return user.name
    } else {
        return user_id
    }
}

export async function getUserFromName(name: string) {
    return await prisma.user.findFirst({
        where: {
            name: name
        }
    })
}