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
            <li class="person" v-for="chat in  chats" :key="chat.id"
                @click="chat_id = chat.chat_id; to_user = chat.WithUser; markMessagesAsRead(chat); hideChatButton()">
              <div class="message-preview">
                <span class="chat_title">{{ getChatTitle(chat) }}</span>
                <span class="company-info" v-if=" user.is_admin ">{{
                    chat.WithUser?.company?.name || chat?.WithUser?.company
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
import {UserChatObject} from "~/types";
import {onMessageCallback} from "~/helpers/clientHelpers";
import {Attachment, Message} from "@prisma/client";

const user = useUser().value
const chats = ref<UserChatObject[]>([])
const chat_id = ref<string>('')
const chat_isRevealed = ref<boolean>(false)

const messages = computed(() => {
  return chats.value.find((chat: any) => chat.chat_id === chat_id.value)?.Message
})

const to_user = ref<any>({})

function unread_count(eval_messages: any[]) {
  return eval_messages.filter((message: any) => !message?.opened && message?.from_user_id != user.user_id).length
}

function show_all_unread_count() {
  let chats_with_unread_messages = chats.value.filter((chat: any) => unread_count(chat.Message) > 0)
  let new_message_indicator = document?.getElementById('new-message-indicator')

  if (!(process.client && chats_with_unread_messages.length > 0 && !chat_isRevealed.value)) return
  if (!new_message_indicator) return

  if (chats_with_unread_messages.length > 0) {
    new_message_indicator.classList.remove('hidden')
    new_message_indicator.innerText = chats_with_unread_messages.length.toString()
  } else {
    new_message_indicator.classList.add('hidden')
  }
}


function getChatTitle(chat: any) {
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
      if (res.statusCode !== 200) return

      chats.value = chats.value.map((c: any) => {
        if (c.chat_id !== chat.chat_id) return c

        return {
          ...c,
          Message: c.Message.map((m: any) => {
            return {...m, opened: true}
          })
        }
      })
      show_all_unread_count()
    }).catch((e: any) => {
      console.log(e)
    })
  }
}

function lastMessage(Message: any[]) {
  try {
    let last = Message[Message.length - 1].message.split('').splice(0, 20).join('')

    if (last.length < 20) return last

    last += '...'
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
  event.target.classList.add('is-open')

  if (!process.client) return

  let new_message_indicator = document?.getElementById('new-message-indicator')
  new_message_indicator?.classList.add('hidden')
}

function concealChat() {
  chat_isRevealed.value = false

  document?.getElementById('chat')?.classList.remove('is-open')

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
        if (res.statusCode !== 200) return []
        return res.body as UserChatObject[]
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

function closeChatBox() {
  chat_id.value = ''
  to_user.value = {}

  showChatButton()
}

function hideChatButton() {
  document?.getElementById('chat')?.classList.add('not_active')
}

function showChatButton() {
  if (document?.getElementById('chat')?.classList.contains('not_active')) {
    document?.getElementById('chat')?.classList.remove('not_active')
  }
}

function positionMessages() {
  nextTick(() => {
    const messages_container = document?.getElementById("messages_container")

    if (messages_container) {
      messages_container.scrollTop = messages_container.scrollHeight;
    }
  })
}

getChats()

const socket = useGlobalSocket().value
if(socket){
  socket.onMessageCallback = (_message: Message & { attachments: Attachment[] } & { chat_id: string }) => {
    const chat = onMessageCallback(_message, chats, getChats)

    if (chat?.chat_id === chat_id.value) markMessagesAsRead(chat, true)

    positionMessages()
    sortChats()
    show_all_unread_count()
  }
}
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

  left: 325px !important;

  transition: left .3s cubic-bezier(0.27, 0.5, 0.8, 1.25);

  @media screen and (max-width: 768px) {
    left: 290px !important;
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