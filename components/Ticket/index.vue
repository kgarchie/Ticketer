<template>
    <main class="container">
        <div class="column">
            <h3 class="is-5 raised"><strong>Ticket Info</strong></h3>
            <article class="columns is-flex box mt-3">
                <div class="column">
                    <div class="field">
                        <label class="label">Reference</label>
                        <div class="control">
                            <p>{{ local_ticket.reference }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Safaricom Number</label>
                        <div class="control">
                            <p>{{ local_ticket.safaricom_no }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Airtel Number</label>
                        <div class="control">
                            <p>{{ local_ticket.airtel_no }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Transaction Amount</label>
                        <div class="control">
                            <p>{{ local_ticket.amount }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">User Name</label>
                        <div class="control">
                            <p>{{ userName }}</p>
                        </div>
                    </div>
                </div>

                <div class="column">
                    <div class="field">
                        <label class="label">Issue</label>
                        <div class="control">
                            <p>{{ local_ticket.issue }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Company</label>
                        <div class="control">
                            <p>{{ local_ticket.company || 'No Company Info' }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Paybill</label>
                        <div class="control">
                            <p>{{ local_ticket.paybill_no }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Additional Info</label>
                        <div class="control">
                            <p>{{ local_ticket.a_info || 'No Additional Info' }}</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Urgency</label>
                        <div class="control">
                            <p>{{ local_ticket.urgency }}</p>
                        </div>
                    </div>
                </div>
            </article>
            <!--                Buttons for close, resolve or delete-->
            <article class="box pb-5" v-if="user.is_admin">
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
            <article class="comments">
                <h3 class="is-5 raised">Comments</h3>
                <div v-if="comments.length > 0" v-for="comment in comments"
                     :key="comment.id">
                    <div v-if="comment?.parentId === null">
                        <article class="media">
                            <div class="media-content">
                                <TicketCommentList :comment="comment" :ticket="local_ticket" :taggable="taggable"/>
                            </div>
                        </article>
                    </div>
                    <hr v-if="comment?.parentId === null"/>
                </div>
                <div class="box" v-else>
                    <p>No comments yet</p>
                </div>
                <div class="mt-3"></div>
                <TicketCommentForm @comment="submitComment" :taggable="taggable"/>
            </article>
        </div>
    </main>
</template>

<script lang="ts" setup>
import {Comment} from "@prisma/client";
import {CommentOperation, SocketStatus, STATUS, TaggedPerson} from "~/types";

const user = useUser()
const userName = ref('')

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
})

const local_ticket = ref(props.ticket)
const comments = ref(local_ticket.value.comments)

const admins = ref([])
const {data: admins_response} = await useFetch('/api/user/admins')

if (admins_response?.value?.statusCode === 200) {
    admins.value = admins_response?.value?.body
}

// console.log(admins.value)

// taggable is all people who have commented on this ticket and admins if they are not in the list
const taggable = computed(() => {
    let taggable_user_ids = props?.ticket?.comments.map((comment: any) => comment.commentor)
    taggable_user_ids = [...new Set(taggable_user_ids)]
    // console.log(taggable_user_ids)
    const taggable: any = []

    for (const user_id of taggable_user_ids) {
        const name_or_user_id = getUserName(user_id)
        taggable.push({name: name_or_user_id, user_id: user_id})
    }

    // console.log(taggable)

    admins?.value?.forEach((admin: any) => {
        if (!taggable_user_ids.includes(admin.user_id)) {
            taggable.push({name: admin.name, user_id: admin.user_id})
        }
    })

    // console.log(taggable)

    return taggable
})

async function closeTicket() {
    if (user.value.is_admin) {
        const {data: response} = await useFetch(`/api/tickets/${local_ticket.value.id}/close`, {
            method: 'POST'
        })

        // update the ticket status
        if (response?.value?.statusCode === 200) {
            local_ticket.value.status = STATUS.C
        } else {
            alert('Operation Failed')
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

async function resolveTicket() {
    if (user.value.is_admin) {
        const {data: response} = await useFetch(`/api/tickets/${local_ticket.value.id}/resolve`, {
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
        const {data: response} = await useFetch(`/api/tickets/${local_ticket.value.id}`, {
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

async function submitComment(payload: any) {
    let {comment, tagged} = payload
    if (comment === '') return alert('Please enter a comment before submitting')
    const {data: db_user} = await useFetch(`/api/user/${user.value.user_id}`)
    // console.log(db_user.value)

    if (db_user?.value?.statusCode === 200) {
        // prepend name to comment
        // @ts-ignore
        comment = `${db_user.value.body} : ${comment}`
        // console.log(comment)

        const {data: response} = await useFetch(`/api/tickets/${props.ticket.id}/comment`, {
            method: 'POST',
            body: {
                comment: comment,
                commentor: user.value.user_id,
                parentId: null,
                tagged: tagged as TaggedPerson[]
            }
        })

        // console.log(response.value)

        if (response?.value?.statusCode !== 200) {
            console.log(response.value?.body)
            alert('An error occurred')
        } else {
            let comment = response?.value?.body

            // console.log(comment)

            // if comment doesn't exist in comments array, add it
            if (useWsServerStatus().value !== SocketStatus.OPEN) {
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
    } else {
        alert('An error occurred; try refreshing the page')
    }

}

async function getUserName(user_id: string) {
    const res = await useFetch(`/api/user/${user_id}`)
    // console.log(res.data.value.body)
    if (res?.data?.value?.statusCode === 200) {
        return res.data.value.body
    } else {
        return user_id
    }
}

userName.value = await getUserName(props.ticket.creator)

watch(useWsServerStatus(), value => {
    if (value !== SocketStatus.OPEN) {
        let poll = setInterval(async () => {
            if (useWsServerStatus().value === SocketStatus.OPEN) {
                clearInterval(poll)
            } else {
                let new_ticket = await $fetch(`/api/tickets/${props.ticket.id}`)
                local_ticket.value.comments = new_ticket.body?.comments
            }
        }, 2000)
    }
})

watch(useNewTicketComment(), (newValue, oldValue) => {
    if (newValue !== oldValue) {
        // if there is a new ticket comment and it doesn't already exist in the comments array, add it
        if (newValue?.ticketId === local_ticket.value.id && !local_ticket.value.comments.find((c: any) => c.id === newValue?.id)) {
            comments.value.push(newValue)
            console.log(newValue)
        }
    }
})

watch(useCommentActions(), value => {
    if (value) {
        // console.log(value)
        if (value.action === CommentOperation.DELETE && value.ticket.id === props.ticket.id) {
            comments.value = comments.value.filter((comment: Comment) => comment.id !== value.commentId)
        }
    }
})
</script>

<style scoped>
.raised {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    padding: 1rem;
    border-radius: 5px;
    background-color: #f5f5f5;
    box-shadow: 0 0 0 1px rgba(10, 10, 10, .1), 0 2px 4px 1px rgba(10, 10, 10, .1);
}
</style>