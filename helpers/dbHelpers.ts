import {CannedResponseMessages, MessageTemplate, NOTIFICATION_TYPE} from "~/types";
import prisma from "~/helpers/script";
import {EphemeralUser, User} from "@prisma/client";

export async function getUser(user_id: string) {
    let user: User | EphemeralUser | null;
    let isEphemeral: boolean = true;

    user = await prisma.user.findUnique({
        where: {
            user_id: user_id
        }
    }).then((data) => {
        if (data?.user_id) {
            isEphemeral = false;
            return data;
        } else {
            return null;
        }
    }).catch((err) => {
        console.log(err)
        return null;
    });

    if (!user) {
        user = await prisma.ephemeralUser.findUnique({
            where: {
                user_id: user_id
            }
        }).then((data) => {
            if (data?.user_id) {
                return data;
            } else {
                return null;
            }
        }).catch((err) => {
            console.log(err)
            return null;
        });
    }

    if (!user) {
        return {
            user: null,
            isEphemeral: false,
        };
    }

    return {
        user: user,
        isEphemeral: isEphemeral,
    };
}

export async function getOrCreateChat(message_object: MessageTemplate) {
    let create = {
        chat_id: message_object.chat_id
    }

    // try to get chat from messages with from and to user that are the same as the message trying to be sent
    let chat_id = await prisma.chat.findFirst({
        where: {
            AND: [
                {
                    Message: {
                        some: {
                            from_user_id: message_object.user_id,
                            to_user_id: message_object.message_to
                        }
                    }
                },
                {
                    Message: {
                        some: {
                            from_user_id: message_object.message_to,
                            to_user_id: message_object.user_id
                        }
                    }
                }
            ]
        }
    }).then((data) => {
        if (data?.chat_id) {
            return data.chat_id;
        } else {
            return null;
        }
    }).catch((err) => {
        console.log(err)
        return null;
    });

    if (chat_id) {
        create.chat_id = chat_id;
    }

    return await prisma.chat.upsert({
        where: {
            chat_id: create.chat_id
        },
        create: {
            ...create
        },
        update: {},
    }).catch(
        (error) => {
            console.log(error)
        }
    )
}

export async function createMessage(message: MessageTemplate) {
    return prisma.message.create(
        {
            data: {
                chat: {
                    connect: {
                        chat_id: message.chat_id || undefined
                    }
                },
                from_user_id: message.user_id,
                to_user_id: message.message_to,
                message: message.message_body || ''
            }
        }
    );
}

export function createNotification(notificationFor: string, message: string, type: NOTIFICATION_TYPE, socketed: boolean) {
    return prisma.notification.create({
        data: {
            for_user_id: notificationFor,
            type: type,
            message: message,
            opened: socketed
        }
    }).then(
        (data) => {
            if (data) {
                return data;
            } else {
                return null;
            }
        }
    ).catch((err) => {
        console.log(err);
    })
}

export async function notifyAllAdmins(message: string) {
    let admins = await prisma.user.findMany({
        where: {
            is_admin: true
        }
    }).then((data:any) => {
        if (data) {
            return data;
        } else {
            return null;
        }
    }).catch((err:any) => {
        console.log(err);
        return null;
    });

    if (!admins) {
        return {
            statusCode: 400,
            body: "No Admins"
        }
    }

    let notifications = [];

    for (const admin of admins) {
        // @ts-ignore
        notifications.push(createNotification(admin.user_id, message, NOTIFICATION_TYPE.N, false));
    }

    await Promise.all(notifications);

    return {
        statusCode: 200,
        body: CannedResponseMessages.MESSAGE_SENT
    }
}

export async function messageAllAdmins(message: MessageTemplate) {
    const admins = await prisma.user.findMany({
        where: {
            is_admin: true
        }
    }).then((data) => {
        if (data) {
            return data;
        } else {
            return null;
        }
    }).catch((err) => {
        console.log(err);
        return null;
    });

    if (!admins) {
        return {
            statusCode: 400,
            body: "No Admins"
        }
    }

    let messages = [];
    let notifications = [];

    for (const admin of admins) {
        messages.push(createMessage({
            ...message,
            // @ts-ignore
            message_to: admin.user_id
        }));
        // @ts-ignore
        notifications.push(createNotification(admin.user_id, `New message from ${message.user_id}`, NOTIFICATION_TYPE.N, false));
    }

    await Promise.all(messages);
    await Promise.all(notifications);

    return {
        statusCode: 200,
        body: CannedResponseMessages.MESSAGE_SENT
    }
}

export async function loginWithEmailPassword(email:string, password:string, previous_token_string:string | null) {
    return await prisma.user.findFirst({
        where: {
            email: email
        }
    }).then(
        async (data) => {
            if (data && data.password == password) {
                if (previous_token_string == "") {
                    previous_token_string = null
                }

                let previous_token = await prisma.token.findFirst({
                    where: {
                        token: previous_token_string || undefined,
                        User: {
                            email: email
                        }
                    }
                })

                if (previous_token) {
                    await prisma.token.update({
                        where: {
                            id: previous_token.id
                        },
                        data: {
                            is_valid: false
                        }
                    })
                }

                let new_token = new Date().getTime().toString(36) + Math.random().toString(36).substr(2)

                return prisma.token.create({
                    data: {
                        token: new_token,
                        User: {
                            connect: {
                                user_id: data.user_id || undefined
                            }
                        }
                    },
                    include: {
                        User: true
                    }
                });
            } else {
                return null
            }
        }
    ).catch(
        (error) => {
            console.log(error);
            return null
        })
}
