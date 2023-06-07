<template>
  <div class="chat_box is-flex is-flex-direction-column is-justify-content-space-between" id="message-container">
    <div class="top-bar">
      <div class="avatar"><p>{{ getUserInitial(String(to_user.name)) }}</p></div>
      <div class="name">{{ String(to_user.name) }}</div>
      <div class="icons">
        <i class="fas fa-phone cursor-pointer" @click="placeAudioCall()" id="call-icon"></i>
        <i class="fas fa-video"></i>
      </div>
      <div class="chat_menu">
        <button type="button" class="close-chat" id="closeChatBox" @click="$emit('close')">
          <span class="ex"></span>
        </button>
      </div>
    </div>
    <div class="middle" id="messages_container">
      <div class="messages" id="chat_box" v-for="message in messages" :key="message?.id">
        <div class="bubble incoming" v-if="message?.to_user_id === user?.user_id">
          <p>{{ message?.message }}</p>
          <div v-if="message?.attachments?.length > 0" class="attachments">
            <div v-for="file in message.attachments" :key="file.name" class="attachment">
                            <span
                                class="is-flex is-align-items-center is-justify-content-space-between">
                                <small class="is-small cursor-pointer" @click="onlinePreview(file.url)">{{
                                    file?.name?.substring(0, 10) || 'unknown'
                                  }}..{{ file?.name?.split('.').pop() || '???' }}</small>
                                <a :href="getUrl(file.url)" target="_blank"
                                   class="ml-2 fas fa-download is-inline cursor-pointer" download></a>
                            </span>
            </div>
          </div>
          <small class="time">{{ new Date(message?.created_at).toLocaleString() || '' }}</small>
        </div>
        <div class="bubble outgoing" v-else>
          <p>{{ message?.message }}</p>
          <div v-if="message?.attachments?.length > 0" class="attachments">
            <div v-for="file in message.attachments" :key="file.id" class="attachment">
                            <span
                                class="is-flex is-align-items-center is-justify-content-space-between">
                                <span class="is-medium cursor-pointer" @click="onlinePreview(file.url)">{{
                                    file?.name?.substring(0, 10) || 'unknown'
                                  }}..{{ file?.name?.split('.').pop() || '???' }}</span>
                                <a target="_blank" :href="getUrl(file.url)"
                                   class="ml-2 fas fa-download is-inline cursor-pointer" download></a>
                            </span>
            </div>
          </div>
          <small class="time">{{ new Date(message?.created_at).toLocaleString() || '' }} </small>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <ul class="is-flex scroll-left" v-if="files">
        <li v-for="file in files" :key="file.name" class="is-inline">
          <p class="file-name is-flex is-align-items-center is-justify-content-space-between">
            <small @click="preview(file)" class="is-small cursor-pointer">{{
                file.name.substring(0, 10)
              }}..{{ file.name.split('.').pop() }}</small>
            <i class="ml-2 fas fa-times is-inline cursor-pointer" @click="removeFile(file.name)"></i>
          </p>
        </li>
      </ul>
      <div class="text">
        <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <textarea id="chat_input" class="chat_input" type="text" placeholder="Type a message..."
                              v-model="composed_message" autocomplete="none"></textarea>

          <button class="button attachment fas fa-paperclip" @click="openFilePicker()"
                  :disabled="pending"></button>
          <button class="button is-primary fas fa-paper-plane" @click="sendMessage()"
                  :class="{ 'is-loading': pending }" :disabled="pending"></button>
        </div>
      </div>
      <embed class="file-preview" id="file-preview"/>
      <i class="fas fa-times close-preview not_active" @click="closePreview()" id="close-preview-button"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {SocketStatus} from "~/types";

const eCall = useCall().value

const composed_message = ref('')
const user = useUser().value
const files = ref<FileList | null>(null)
const pending = ref(false)

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
    document.getElementById("messages_container")!.scrollTop = document.getElementById("messages_container")!.scrollHeight;
  })
}

positionMessages()

// function upload (url: string, file: File, message:any) {
//     const form = new FormData()
//     form.append('file', file)
//
//
//     const xhr = new XMLHttpRequest()
//     xhr.open('post', url, true)
//     xhr.upload.onprogress = function (ev) {
//         // Upload progress here
//         console.log(ev)
//     }
//     xhr.onreadystatechange = function () {
//         if (xhr.readyState === 4) {
//             // Uploaded
//             console.log('Uploaded')
//         }
//     }
//     xhr.send(form)
// }

async function sendMessage() {
  if (composed_message.value === '' && !files.value) {
    alert('Please enter a message or select a file to send')
    return
  }

  let message = {
    from_user_id: user.user_id,
    to_user_id: props.to_user.user_id,
    message: composed_message.value.trim(),
    chat_id: props.chat_id
  }

  let upload_files = (files.value && files.value.length > 0) ? files.value : null

  const formData = new FormData()
  formData.append('from_user_id', message.from_user_id);
  formData.append('to_user_id', message.to_user_id);
  formData.append('message', message.message);
  formData.append('chat_id', message.chat_id);
  if (upload_files) {
    for (let i = 0; i < upload_files.length; i++) {
      formData.append('files', upload_files[i])
    }
  }

  // console.log(message)
  pending.value = true
  const {data: response} = await useFetch('/api/chats/messages/send', {
    method: 'POST',
    body: formData
  })

  pending.value = false

  // console.log(response.value.body)

  if (response.value?.statusCode === 200) {
    setTimeout(() => {
      if (!props.messages?.find((msg: any) => msg.id === response.value?.body?.id)) {
        props.messages?.push(response.value?.body)
        console.log("Message added via post request")
        useGlobalSocket().value.WsServerStatus = SocketStatus.UNKNOWN
        positionMessages()
      }
    }, 500)
  } else {
    alert(response.value?.body.toString())
  }
  positionMessages()
  composed_message.value = ''
  files.value = null
}

function getUserInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

onMounted(() => {
  const chat_input = document.getElementById('chat_input')
  chat_input?.focus()
  chat_input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })
})

function openFilePicker() {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.multiple = true
  fileInput.accept = '*'
  fileInput.click()
  fileInput.addEventListener('change', (e) => {
    // @ts-ignore
    const picked_files = e?.target?.files
    if (picked_files) {
      files.value = picked_files
    }
  })
}

function removeFile(name: string) {
  const new_files = Array.from(files.value || []).filter((file: File) => file.name !== name)
  // @ts-ignore
  files.value = new_files.length > 0 ? new_files : null
}

function preview(file: File) {
  const filePreview = document.getElementById('file-preview')
  const previewButton = document.getElementById('close-preview-button')
  previewButton?.classList.remove('not_active')

  showFile(filePreview, previewButton, file)
}

function showFile(filePreview: HTMLElement | null, previewButton: HTMLElement | null, file_or_url: any) {
  let ext = null
  let type

  if (typeof file_or_url === 'object') {
    type = file_or_url.type.split('/')[0]
    ext = file_or_url.name.split('.').pop()?.toLowerCase()
    type = type.toLowerCase()
  } else {
    type = file_or_url.split('.').pop()?.toLowerCase() || ''
    type = type.toLowerCase()
  }

  if (type === 'image' || type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif') {
    filePreview?.setAttribute('src', URL.createObjectURL(file_or_url))
  } else if (type === 'video' || type === 'audio' || ext === 'pdf' || type === 'mp4' || type === 'mp3' || type === 'pdf') {
    filePreview?.setAttribute('src', URL.createObjectURL(file_or_url))
    filePreview?.setAttribute('type', file_or_url.type)
    filePreview?.setAttribute('controls', 'true')
  } else {
    previewButton?.classList.add('not_active')
    alert('File preview not yet supported for this kind of file')
  }
}

async function onlinePreview(partial_url: string) {
  const url = await getUrl(partial_url)
  const filePreview = document.getElementById('file-preview')
  const previewButton = document.getElementById('close-preview-button')
  previewButton?.classList.remove('not_active')

  showFile(filePreview, previewButton, url)
}

function closePreview() {
  const previewButton = document.getElementById('close-preview-button')
  const filePreview = document.getElementById('file-preview')

  previewButton?.classList.add('not_active')
  filePreview?.removeAttribute('src')
  filePreview?.removeAttribute('type')
  filePreview?.removeAttribute('controls')
}

let _switch = false

function placeAudioCall() {
  if (!_switch) {
    eCall.placeAudioCall(props.to_user.user_id, props.chat_id || null)
  } else {
    eCall.endCall(user.user_id)
  }
  _switch = !_switch
}

const getUrl = (url: string) => {
  useFetch('/api/chats/messages/attachment/' + url)
      .then(
          (res) => {
            const response = res.data.value as any
            if (response.statusCode === 200) {
              return response.body
            } else {
              alert(response.body.toString())
              return null
            }
          },
          (error) => {
            console.log(error)
            return null
          }
      ).catch(
      (error) => {
        console.log(error)
        return null
      }
  )
}
</script>

<style scoped lang="scss">
.icons {
  margin-left: auto;
  margin-right: 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 50px;

  .on-call {
    color: #0F1D38;
  }
}

.attachment {
  color: #2aa7c4;

  opacity: 0.5;
}

.attachments {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;

  .attachment {
    padding: 5px 10px;
    margin: 5px;
    border-radius: 5px;
    background: #f5f5f5;
    color: #2aa7c4;
    opacity: 0.5;
    cursor: pointer;
    font-size: 0.9rem;
  }
}

.fa-phone {
  color: #03c3a9;
}

.fa-video {
  color: #5a86e4;
}

.file-preview {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.close-preview {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 30px;
  height: 30px;

  border-radius: 50%;
  background: linear-gradient(to bottom left, hsl(221, 72%, 62%) 20%, hsl(184, 70%, 54%) 100%);
  color: white;
  font-size: 1.25rem;
  text-align: center;
  line-height: 30px;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom right, #B558E4FF 20%, hsl(187, 70%, 54%) 100%);
  }
}

.is-small {
  font-size: 0.75rem;
}

.cursor-pointer {
  cursor: pointer;

  &:hover {
    color: #5a86e4;
    text-decoration: underline;
  }
}

.scroll-left {
  background-color: transparent;
  width: 370px;
  overflow-x: scroll;
}

.scroll-left::-webkit-scrollbar {
  display: none;
}

.incoming .attachment {
  background: #0015ff;
  color: #c5ffde;

  a {
    color: #c5ffde;

    &:hover {
      color: #b558e4;
      scale: 1.25;
    }
  }
}
</style>