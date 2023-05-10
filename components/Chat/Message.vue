<template>
    <div class="chat_box is-flex is-flex-direction-column is-justify-content-space-between">
        <div class="top-bar">
            <div class="avatar"><p>{{ getUserInitial(String(to_user.name)) }}</p></div>
            <div class="name">{{ String(to_user.name) }}</div>
            <div class="icons">
                <i class="fas fa-phone"></i>
                <i class="fas fa-video"></i>
            </div>
            <div class="chat_menu">
                <button type="button" class="close-chat" id="closeChatBox" @click="$emit('close')">
                    <span class="ex"></span>
                </button>
            </div>
        </div>
        <div class="middle" id="messages_container">
            <div class="messages" id="chat_box" v-for="message in messages" :key="message.id">
                <div class="bubble incoming" v-if="message.to_user_id === user.user_id">
                    <p>{{ message.message }}</p>
                    <small class="time">{{ new Date(message?.created_at).toLocaleString() || '' }}</small>
                </div>
                <div class="bubble outgoing" v-else>
                    <p>{{ message.message }}</p>
                    <small class="time">{{ new Date(message?.created_at).toLocaleString() || '' }} </small>
                </div>
            </div>
        </div>
        <div class="bottom-bar">
            <div class="text">
                        <textarea id="chat_input" class="chat_input" type="text" placeholder="Type a message..."
                                  v-model="composed_message" autocomplete="none"></textarea>
                <button class="chat_button is-primary" type="submit" id="send" @click="sendMessage">Send
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {SocketStatus} from "~/types";

const composed_message = ref('')
const user = useUser().value

const props = defineProps({
    messages: {
        type: Array,
        required: false,
        default: () => []
    },
    to_user: {
        type: Object,
        required: true,
        default: () => {
        }
    },
    chat_id: {
        type: String,
        required: true
    }
})

function positionMessages() {
    nextTick(() => {
        // @ts-ignore
        document.getElementById("messages_container").scrollTop = document.getElementById("messages_container").scrollHeight;
    })
}

positionMessages()

async function sendMessage() {
    if (composed_message.value === '') {
        alert('Please enter a message')
        return
    }

    let message = {
        from_user_id: user.user_id,
        to_user_id: props.to_user.user_id,
        message: composed_message.value.trim(),
        chat_id: props.chat_id
    }

    // console.log(message.chat_id)

    const {data: response} = await useFetch('/api/chats/messages/send', {
        method: 'POST',
        body: message
    })

    console.log(response.value.body)

    if (response.value?.statusCode === 200) {
        setTimeout(() => {
            if(!props.messages?.find((msg: any) => msg.id === response.value?.body?.id)) {
                props.messages?.push(response.value?.body)
                console.log("Message added via post request")
                useWsServerStatus().value = SocketStatus.UNKNOWN
            }
        }, 500)
        positionMessages()
    } else {
        alert(response.value?.body)
    }
    composed_message.value = ''
}

function getUserInitial(name: string) {
    return name.charAt(0).toUpperCase()
}

onMounted(() => {
    document.getElementById('chat_input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    })
})


</script>

<style scoped>
</style>