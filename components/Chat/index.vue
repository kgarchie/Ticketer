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
                            @click="chat_id = chat.chat_id; to_user = chat.WithUser; markMessagesAsRead(chat); hideChatButton()">
                            <div class="message-preview">
                                <span class="chat_title">{{ getChatTitle(chat) }}</span>
                                <span class="company-info" v-if=" user.is_admin ">{{
                                    chat.WithUser.company.name || chat.WithUser.company
                                    }}</span>
                                <span class="email" v-if=" user.is_admin ">{{ chat.WithUser.email }}</span>
                                <span class="unread" v-if=" unread_count(chat.Message) > 0 ">{{
                                    unread_count(chat.Message)
                                    }}</span>
                                <span class="preview">{{ lastMessage(chat.Message) }}</span>
                                <span class="time">{{ lastMessageTime(chat.Message) }}</span>
                            </div>
                            <br>
                        </li>
                    </ul>
                </div>
                <ChatMessage :messages="messages" :to_user=" to_user " :chat_id="chat_id"
                             v-if=" message_isRevealed "
                             @close=" closeChatBox "/>
            </div>
        </div>
        <div>
            <span id="new-message-indicator" class="new-message-indicator hidden"></span>
            <button class="button is-primary" id="chat" @click="revealChat">
                Chat
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import {Message} from "@prisma/client";
import {UserChatObject, SocketStatus} from "~/types";
import {updateNewTickets, updateNotifications, updateTicketsMetaData} from "~/helpers/clientHelpers";

const user = useUser().value
const WsServerStatusState = useWsServerStatus()

const chats = ref<UserChatObject[]>([])
const chat_id = ref<string>('')
const chat_isRevealed = ref<boolean>(false)

const messages = computed(() => {
    return chats.value.find((chat: any) => chat.chat_id === chat_id.value)?.Message
})

const to_user = ref<any>({})

function unread_count(eval_messages: Message[]) {
    return eval_messages.filter((message: Message) => !message.opened && message.from_user_id != user.user_id).length
}


function show_all_unread_count() {
    let chats_with_unread_messages = chats.value.filter((chat: any) => unread_count(chat.Message) > 0)
    // console.log(chats_with_unread_messages)

    if (process.client && chats_with_unread_messages.length > 0 && !chat_isRevealed.value) {
        let new_message_indicator = document.getElementById('new-message-indicator')
        if (new_message_indicator) {
            if (chats_with_unread_messages.length > 0) {
                new_message_indicator.classList.remove('hidden')
                new_message_indicator.innerText = chats_with_unread_messages.length.toString()
            } else {
                new_message_indicator.classList.add('hidden')
            }
        }
    }
}


function getChatTitle(chat: any) {
    // console.log(chat.WithUser)
    if (chat.WithUser.name !== "Anonymous") {
        return chat.WithUser.name
    } else {
        return chat.WithUser.user_id
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

    // remove the new message indicator
    if (process.client) {
        let new_message_indicator = document.getElementById('new-message-indicator')
        if (new_message_indicator) {
            new_message_indicator.classList.add('hidden')
        }
    }
}

function concealChat() {
    chat_isRevealed.value = false

    document.getElementById('chat')?.classList.remove('is-open')

    setTimeout(() => {
        show_all_unread_count()
    }, 500)
}

const message_isRevealed = computed(() => {
    return chat_isRevealed.value && (chat_id.value !== '' && chat_id.value !== undefined && chat_id.value !== null)
})

async function getChats() {
    let db_chats = await $fetch('/api/chats', {
        method: 'POST',
        body: user.user_id.toString()
    }).then(
        (res: any) => {
            if (res.statusCode === 200) {
                return res.body as UserChatObject[]
            } else {
                console.log(res.body)
                return []
            }
        }
    ).catch((e: any) => {
        console.log(e)
        return []
    })

    chats.value = db_chats.filter((chat: any) => chat.WithUser.user_id !== user.user_id)
    sortChats()

    show_all_unread_count()
}

function sortChats() {
    // sort chats except
    chats.value = chats.value.sort((a: any, b: any) => {
        let a_last_message = a.Message[a.Message.length - 1] || null
        let b_last_message = b.Message[b.Message.length - 1] || null

        if (a_last_message && b_last_message) {
            return new Date(b_last_message.created_at).getTime() - new Date(a_last_message.created_at).getTime()
        } else {
            return 0
        }
    })
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
    if (!(newValue === SocketStatus.CLOSED)) {
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
                    sortChats()
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
        document.getElementById("messages_container").scrollTop = document.getElementById("messages_container")?.scrollHeight;
    })
}

getChats()

watch(useNewMessage(), newMessage => {
    // console.log("new message", newMessage)
    if (newMessage) {
        try{
            let chat = chats.value.find(chat => chat.id.toString() === newMessage?.chatId.toString())

            if (chat && newMessage) {
                if (!chat.Message.find((message: any) => message.id === newMessage.id)) {
                    chat.Message.push(newMessage)
                } else {
                    console.log('message already exists')
                }
            } else {
                getChats()
            }

            if(chat?.chat_id === chat_id.value){
                markMessagesAsRead(chat, true)
            }
            positionMessages()
            sortChats()
            show_all_unread_count()
        } catch (e) {
            console.warn(e)
        }
    }
})

</script>
<style scoped lang="scss">
$accent: hsl(221, 73%, 63%);

.Chat {
  position: fixed;
  left: 20px;
  bottom: 20px;

  @media screen and (max-width: 768px) {
    left: 10px;
    bottom: 10px;
  }
}

#chat {
  left: 0;
  transition: left .3s cubic-bezier(0.27, 0.5, 0.8, 1.25);
  bottom: 5px;
}

.is-open {
  background: $accent;
  color: white;

  left: 310px !important;

  transition: left .3s cubic-bezier(0.27, 0.5, 0.8, 1.25);

  @media screen and (max-width: 768px) {
    right: 0 !important;
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