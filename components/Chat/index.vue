<template>
    <div class="Chat">
        <div class="chat-wrapper" v-if="chat_isRevealed">
            <div class="chat_container">
                <div class="user-profile" style="width: 100%">
                    <div class="user-name is-flex is-align-items-center" style="font-size: 1.2rem">Chats</div>
                    <button class="close-chat" style="cursor: pointer" @click="concealChat">
                        <span class="ex"></span>
                    </button>
                </div>
                <div class="is-flex is-flex-direction-column message-list">
                    <ul class="people">
                        <li class="person" v-for="chat in  chats " :key="chat.id"
                            @click="chat_id = chat.chat_id; to_user = getToUserAsProp(chat); markMessagesAsRead(chat); hideChatButton()">
                            <div class="message-preview">
                                <span class="chat_title">{{ getChatTitle(chat) }}</span>
                                <span class="company-info" v-if=" user.is_admin ">{{ getCompanyName(chat) }}</span>
                                <span class="email" v-if=" user.is_admin ">{{ getEmail(chat) }}</span>
                                <span class="unread" v-if=" unread_count(chat.Message) > 0 ">{{ unread_count(chat.Message)
                                    }}</span>
                                <span class="preview">{{ lastMessage(chat.Message) }}</span>
                                <span class="time">{{ lastMessageTime(chat.Message) }}</span>
                            </div>
                            <br>
                        </li>
                    </ul>
                </div>
                <ChatMessage :messages=" messages " :to_user=" to_user " :chat_id=" chat_id " v-if=" message_isRevealed "
                    @close=" closeChatBox " />
            </div>
        </div>
        <div>
            <span id="new-message-indicator" class="new-message-indicator hidden"></span>
            <button class="button is-primary" id="chat" @click=" revealChat ">
                Chat
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { Message } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid'
import { adminUser, ChatsResponseObject, SocketStatus } from "~/types";
import { updateNewTickets, updateNotifications, updateTicketsMetaData } from "~/helpers/frontEndHelpers";

const user = useUser().value
const WsServerStatusState = useWsServerStatus()

const chats = ref<ChatsResponseObject[]>([])
const chat_id = ref<string>('')
const chat_isRevealed = ref<boolean>(false)
let admins: any[] = []

const messages = computed(() => {
    return chats.value.find((chat: any) => chat.chat_id === chat_id.value)?.Message
})

const to_user = ref<any>({})

function unread_count(eval_messages: Message[]) {
    return eval_messages.filter((message: Message) => !message.opened && message.from_user_id != user.user_id).length
}

function show_all_unread_count() {
    let chats_with_unread_messages = chats.value.filter((chat: any) => unread_count(chat.Message) > 0)

    if (process.client) {
        const indicator = document?.getElementById('new-message-indicator')

        if (indicator) {
            if (chats_with_unread_messages.length > 0) {
                indicator.classList.remove('hidden')
                indicator.innerHTML = chats_with_unread_messages.length.toString();
            } else {
                if (!indicator.classList.contains('hidden')) {
                    indicator.classList.add('hidden')
                }
            }
        }
    }
}


function markMessagesAsRead(chat: any, force: boolean = false) {
    if (unread_count(chat.Message) > 0 || force) {
        $fetch('/api/chats/messages/read', {
            method: 'POST',
            body: {
                chat_id: chat.chat_id,
                user_id: user.user_id
            }
        }).then((res: any) => {
            if (res.statusCode === 200) {
                chats.value = chats.value.map((c: any) => {
                    if (c.chat_id === chat.chat_id) {
                        return {
                            ...c,
                            Message: c.Message.map((m: any) => {
                                return {
                                    ...m,
                                    opened: true
                                }
                            })
                        }
                    } else {
                        return c
                    }
                })

                show_all_unread_count()
            }
        }).catch((e: any) => {
            console.log(e)
        })
    }
}

function getToUserAsProp(chat: any) {
    function getProp(chat: any, propName: string, defaultValue: string): string {
        return chat[propName] ? chat[propName] : chat.to_user?.[propName] ? chat.to_user[propName] : defaultValue;
    }

    let user = {
        ...chat,
        to_user: {
            user_id: chat.to_user.user_id,
            name: getProp(chat, "name", "Unregistered User"),
            email: getProp(chat, "email", "No Email Info"),
            company: getProp(chat, "company", "No Company Info"),
            Message: chat.Message
        }
    }

    return user.to_user
}

function getChatTitle(chat: any) {
    if (chat.name) {
        return chat.name;
    } else {
        return chat.to_user?.name || chat.to_user?.user_id || "Unregistered User"
    }
}

function getCompanyName(chat: any) {
    if (chat.company) {
        return chat.company.name;
    } else {
        return chat.to_user?.company?.name || "No Company Info"
    }
}

function getEmail(chat: any) {
    if (chat.email) {
        return chat.email;
    } else {
        return chat.to_user?.email || "No Email Info"
    }
}

function lastMessage(Message: any[]) {
    try {
        let last = Message[Message.length - 1].message.split('').splice(0, 20).join('')
        if (last.length >= 20) {
            last += '...'
        }
        return last
    } catch (e) {
        return "No Messages"
    }
}

function lastMessageTime(Message: any[]) {
    try {
        return new Date(Message[Message.length - 1].created_at).toLocaleString()
    } catch (e) {
        return ""
    }
}


function revealChat(event: any) {
    chat_isRevealed.value = true

    // console.log(event)

    // add style to the chat button
    event.target.classList.add('is-open')
}

function concealChat() {
    chat_isRevealed.value = false

    document.getElementById('chat')?.classList.remove('is-open')
}

// function message_isRevealed() {
//     return chat_isRevealed.value && chat_id.value !== ''
// }

const message_isRevealed = computed(() => {
    return chat_isRevealed.value && chat_id.value !== ''
})

async function getChats() {
    let db_chats = await $fetch('/api/chats', {
        method: 'POST',
        body: user.user_id.toString()
    }).then(
        (res: any) => {
            if (res.statusCode === 200) {
                return res.body.data as ChatsResponseObject[]
            } else {
                console.log(res.body)
                return []
            }
        }
    ).catch((e: any) => {
        console.log(e)
        return []
    })

    // console.log(db_chats)

    // filter out the normal chats
    let admin_chats = db_chats.filter((chat: any) => chat.to_user?.is_admin).sort((a: any, b: any) => {
        return new Date(b.Message[b.Message.length - 1]?.created_at).getTime() - new Date(a.Message[a.Message.length - 1]?.created_at).getTime()
    })

    admins = await $fetch('/api/user/admins').then(
        (res: any) => {
            if (res.statusCode === 200) {
                return res.body.data as adminUser[]
            } else {
                console.log(res.body)
                return []
            }
        }
    ).catch((e: any) => {
        console.log(e)
        return []
    })

    // console.log(admins)

    // if any admin is not in the chat list, add them
    admins.forEach((admin: adminUser) => {
        if (!admin_chats.find((chat: any) => chat.to_user.user_id === admin.user_id)) {
            admin_chats.push({
                id: (admin_chats.length + 1).toString(),
                Message: [],
                to_user: admin,
                created_at: new Date(),
                ticketId: null,
                chat_id: uuidv4()
            })
        }
    })

    // filter out the admins
    db_chats = db_chats.filter((chat: any) => !chat.to_user?.is_admin).sort((a: any, b: any) => {
        return new Date(b.Message[b.Message.length - 1]?.created_at).getTime() - new Date(a.Message[a.Message.length - 1]?.created_at).getTime()
    })

    // if user is admin, remove his own chat that was created before
    admin_chats = admin_chats.filter((chat: any) => chat.to_user.user_id !== user.user_id)

    chats.value = [...admin_chats, ...db_chats]

    show_all_unread_count()
    // console.log(chats.value)
}

async function pollServerStatus(maxRetries = 10, intervalSeconds = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await $fetch('/api/status');
            if (response) {
                console.log('Server Up | Response Received')
                if (response.statusCode === 200) {
                    console.log('Server status okay, server is online');
                    return 'online';
                } else {
                    console.log(`Server status check failed, retrying in ${intervalSeconds} seconds`);
                    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
                    retries++;
                }
            }
        } catch (e) {
            console.log(`Server status check failed, retrying in ${intervalSeconds} seconds`);
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
            retries++;
        }
    }
    console.log('Server status check failed after maximum retries');
    return 'offline';
}

watch(WsServerStatusState, async (newValue) => {
    if (!(newValue === SocketStatus.CLOSED || newValue === SocketStatus.UNKNOWN)) {
        console.log('Socket Server is up')
        return
    } else {
        console.log('Socket Server is down | Switching to long polling')
        const serverStatus = await pollServerStatus();
        if (serverStatus === 'online') {
            console.log('HTTP Server is up');
            // poll messages
            const pollM = setInterval(() => {
                try {
                    console.log('Polling for new messages, tickets and notifications...');
                    getChats();
                    updateTicketsMetaData(useTicketsMetaData().value)
                    updateNewTickets(useNewTickets())
                    updateNotifications(useNotifications(), user.user_id)


                    if (WsServerStatusState.value === SocketStatus.OPEN) {
                        console.log('Socket has opened removing poll...');
                        clearInterval(pollM);
                        return;
                    }
                } catch (e) {
                    console.log(e)
                }
            }, 3000);
        } else {
            console.log('Server is offline');
        }
    }
})

function closeChatBox() {
    chat_id.value = ''
    to_user.value = {}

    showChatButton()
}

function hideChatButton() {
    document.getElementById('chat')?.classList.add('not_active')
}

function showChatButton() {
    if (document.getElementById('chat')?.classList.contains('not_active')) {
        document.getElementById('chat')?.classList.remove('not_active')
    }
}

function positionMessages() {
    nextTick(() => {
        // @ts-ignore
        document.getElementById("messages_container").scrollTop = document.getElementById("messages_container").scrollHeight;
    })
}

getChats()

watch(useNewMessage(), newMessage => {
    console.log("new message", newMessage)
    let chat = chats.value.find(chat => chat.id.toString() === newMessage?.chatId.toString())

    if (chat && newMessage) {
        if (!chat.Message.find((message: any) => message.id === newMessage.id)) {
            // @ts-ignore
            // if (to_user.value?.user_id === newMessage.from_user_id || to_user.value?.user_id === newMessage.to_user_id) {
            //     newMessage.opened = true
            //     messages.value.push(newMessage)
            //     markMessagesAsRead(chat, true)
            // } else {
            //     chat.Message.push(newMessage)
            // }
            chat.Message.push(newMessage)
        } else {
            console.log('message already exists')
        }
    } else {
        getChats()
    }


    positionMessages()
    show_all_unread_count()
})

</script>
<style scoped lang="scss">
$accent: hsl(221, 73%, 63%);

.Chat {
    position: fixed;
    left: 20px;
    bottom: 20px;
}

#chat {
    left: 0;
    transition: left .3s cubic-bezier(0.27, 0.5, 0.8, 1.25);
}

.is-open {
    background: $accent;
    color: white;

    left: 310px !important;

    transition: left .3s cubic-bezier(0.27, 0.5, 0.8, 1.25);

    //.new-message-indicator {
    //  display: none;
    //}

    @media screen and (max-width: 768px) {
        left: 260px;
    }
}

.new-message-indicator {
    z-index: 100;
    position: absolute;
    background: $accent;
    color: white;
    border-radius: 50%;
    padding: 0.1rem 0.6rem;
    right: -23px;
    top: -25px;
    transition: all .3s ease-in-out;

    &.hidden {
        display: none;
    }
}
</style>