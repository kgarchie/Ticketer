<template>
    <main class="container">
        <div class="column">
            <h3 class="heading ml-1 raised" style="font-size: 15px;"><strong>Ticket Info</strong></h3>
            <article class="column box p-4" style="border-top: 1px solid #f4f4f4">
                <div class="is-flex">
                    <div class="field is-full">
                        <label class="heading" style="font-size: 0.9rem; letter-spacing: 0.1ch;">Reference</label>
                        <div class="control">
                            <p>{{ local_ticket?.reference }}</p>
                        </div>
                    </div>

                    <div class="field is-full">
                        <label class="heading" style="font-size: 0.9rem; letter-spacing: 0.1ch;">User Name</label>
                        <div class="control">
                            <p>{{ userName }}</p>
                        </div>
                    </div>
                </div>
                <div class="content mt-3">
                    <label class="heading" style="font-size: 0.9rem; letter-spacing: 0.1ch;">Message</label>
                    {{ local_ticket.info }}
                </div>
                <div class="attachments">
                    <ClientOnly>
                        <div class="attachment" v-for="attachment of local_ticket.Attachment">
                            <div class="preview" v-html="loadPreview(attachment).outerHTML">
                            </div>
                            <span>
                                {{ attachment.name }}
                                <i class="fas fa-download" @click="downloadAttatchment(attachment)"></i>
                            </span>
                        </div>
                    </ClientOnly>
                </div>
            </article>
            <article class="pb-5" v-if="useCookie<UserAuth>('auth').value?.is_admin">
                <div class="buttons mt-3 is-flex is-fullwidth">
                    <button class="button is-success" @click="resolveTicket"
                        :disabled="local_ticket.status === STATUS.R">
                        Resolve
                    </button>
                    <button class="button is-warning" @click="closeTicket" :disabled="local_ticket.status === STATUS.C">
                        Close
                    </button>
                    <button class="button is-danger ml-auto" @click="deleteTicket">
                        Delete
                    </button>
                </div>
            </article>
            <hr>
            <article class="comments">
                <h2 class="heading" style="font-size: medium">Comments</h2>
                <div v-if="comments?.length > 0" v-for="comment in comments" :key="comment.id">
                    <div v-if="comment?.parentId === null">
                        <article class="media">
                            <div class="media-content">
                                <TicketCommentList :comment="comment" :ticket="local_ticket" :taggable="taggable" />
                            </div>
                        </article>
                    </div>
                    <hr v-if="comment?.parentId === null" />
                </div>
                <div class="box" v-else>
                    <p>No comments yet</p>
                </div>
                <div class="mt-3"></div>
                <TicketCommentForm @comment="submitComment" :taggable="taggable" />
            </article>
        </div>
    </main>
</template>
<style scoped>
.raised {
    margin-bottom: 0.5rem;
    padding: 1rem;
    border-radius: 5px;
    background-color: #f5f5f5;
    box-shadow: 0 0 0 1px rgba(10, 10, 10, .1), 0 2px 4px 1px rgba(10, 10, 10, .1);
}

.is-full {
    width: 100%;
}

.attachments {
    display: flex;
    gap: 1rem;
}

.attachment {
    box-shadow: 0 0 0 1px rgba(10, 10, 10, .1), 0 2px 4px 1px rgba(10, 10, 10, .1);
    padding: 0.3rem 0.8rem;
    cursor: pointer;
}

.attachment:hover {
    background-color: #f5f5f5
}

.attachment span{
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.attachment .preview{
    width: 100px;
    height: 100px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    margin-bottom: 0.5rem;
}

.attachment .preview .default{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    color: #333;
    font-size: 0.8rem;
    border-radius: 5px;
}
</style>
<script lang="ts" setup>
import { type Comment } from "@prisma/client";
import { SocketStatus, STATUS, TYPE, type TaggedPerson } from "~/types";
import type { SocketTemplate, UserAuth } from "~/types"

import {
    onDeleteComment
} from "~/helpers/clientHelpers";


const user = useUser()
const userName = ref('')

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
})

const local_ticket = ref(props.ticket)
const comments = computed(() => {
    return orderComments(local_ticket.value?.comments)
})
const taggable = ref<TaggedPerson[]>([])

const response = await fetch('/api/user/admins').then(res => res.json()).catch(err => console.log(err))
let admins = response?.body
async function getTaggablePeople() {
    let taggable_user_ids = props?.ticket?.comments.map((comment: any) => comment.commentor)
    taggable_user_ids = [...new Set(taggable_user_ids)]

    let taggable: any = []

    for (const user_id of taggable_user_ids) {
        const name_or_user_id = await getUserName(user_id)
        taggable.push({ name: name_or_user_id, user_id: user_id })
    }

    admins?.forEach((admin: any) => {
        if (!taggable_user_ids.includes(admin.user_id)) {
            taggable.push({ name: admin.name, user_id: admin.user_id })
        }
    })

    return taggable
}

taggable.value = await getTaggablePeople()

async function closeTicket() {
    if (user.value.is_admin) {
        const { data: response } = await useFetch(`/api/tickets/${local_ticket.value.id}/close`, {
            method: 'POST'
        })

        if (response?.value?.statusCode === 200) {
            local_ticket.value.status = STATUS.C
        } else {
            alert('Operation Failed')
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

onBeforeMount(async () => {
    if (!props.ticket) {
        await navigateTo(`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`)
    }
})

async function resolveTicket() {
    if (user.value.is_admin) {
        const { data: response } = await useFetch(`/api/tickets/${local_ticket.value.id}/resolve`, {
            method: 'POST'
        })

        // update the ticket status
        if (response?.value?.statusCode === 200) {
            local_ticket.value.status = STATUS.R
        } else {
            alert('Operation Failed')
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

async function deleteTicket() {
    if (user.value.is_admin) {
        const { data: response } = await useFetch(`/api/tickets/${local_ticket.value.id}`, {
            method: 'DELETE'
        })

        // update the ticket status
        if (response?.value?.statusCode === 200) {
            await navigateTo(`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`)
        } else {
            alert('Operation Failed')
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

let oldComment = ''
async function submitComment(payload: any) {
    let { comment, tagged } = payload
    if (comment === '') return alert('Please enter a comment before submitting')
    const { data: db_user } = await useFetch(`/api/user/${user.value.user_id}`)
    // console.log(db_user.value)

    if (db_user?.value?.statusCode === 200 && oldComment !== comment) {
        // prepend name to comment
        // @ts-ignore
        comment = `${db_user.value.body} : ${comment}`
        // console.log(comment)
        oldComment = comment

        const { data: response } = await useFetch(`/api/tickets/${props.ticket.id}/comment`, {
            method: 'POST',
            body: {
                comment: comment,
                commentor: user.value.user_id,
                parentId: null,
                tagged: tagged.value as TaggedPerson[]
            }
        })

        if (response?.value?.statusCode !== 200) {
            console.log(response.value?.body)
            alert('An error occurred')
        } else {
            let comment = response?.value?.body

            if (socket?.status !== SocketStatus.OPEN) {
                props.ticket.comments.push(comment)
            } else {
                setTimeout(() => {
                    if (!props.ticket.comments.find((c: any) => c.id === comment.id)) {
                        props.ticket.comments.push(comment)
                        console.log('comment added via post request')
                    } else {
                        console.log('comment added via websocket')
                    }
                }, 1000);
            }
        }
    } else if (oldComment === comment) {
        console.log('Duplicate comment')
    } else {
        alert('An error occurred; try refreshing the page')
    }

}

userName.value = await getUserName(props.ticket?.creator)

const socket = useSocket().value
socket?.on("data", (_data: SocketTemplate) => {
    const data = parseData(_data)
    if (data?.type === TYPE.NEW_COMMENT) {
        if (data?.body?.ticketId !== local_ticket.value.id) return
        if (comments.value.find((c: any) => c.id === data?.body?.id)) return
        comments.value.push(data?.body)
    } else if (data?.type === TYPE.DELETE_COMMENT) {
        onDeleteComment(data?.body, comments)
    } else if (data?.type === TYPE.DELETE_TICKET) {
        if (data?.body?.id !== local_ticket.value.id) return
        navigateTo(`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`)
    }
})

function orderComments(comments: Comment[]) {
    comments = comments.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    return comments
}
</script>