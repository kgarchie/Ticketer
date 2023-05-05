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
            <article class="comments">
                <h3 class="is-5 raised">Comments</h3>
                <div v-if="local_ticket?.comments.length > 0" v-for="comment in local_ticket.comments"
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
import {CommentAct, SocketStatus} from "~/types";

const user = useUser()
const userName = ref('')

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
})

const local_ticket = ref(props.ticket)

const admins = ref([])

admins.value = await useFetch('/api/user/admins').data?.value?.body?.data

// console.log(admins.value)

// taggable is all people who have commented on this ticket and admins if they are not in the list
// const taggable = computed(async () => {
//     let taggable_user_ids = props.ticket.comments.map((comment: any) => comment.commentor)
//     taggable_user_ids = [...new Set(taggable_user_ids)]
//     // console.log(taggable_user_ids)
//     const taggable: any = []
//     // TODO: next time, fill this on retrieval of ticket
//     for (const user_id of taggable_user_ids) {
//         const name_or_user_id = await getUserName(user_id)
//         taggable.push({name: name_or_user_id, user_id: user_id})
//     }
//
//     // console.log(taggable)
//
//     admins?.value?.forEach((admin: any) => {
//         if (!taggable_user_ids.includes(admin.user_id)) {
//             taggable.push({name: admin.name, user_id: admin.user_id})
//         }
//     })
//
//     // console.log(taggable)
//
//     return taggable
// })

const taggable = [
    {
        "name": "9abd8841-b3ac-4b97-a3d7-b4ca70136661",
        "user_id": "9abd8841-b3ac-4b97-a3d7-b4ca70136661"
    },
    {
        "name": "52e12edf-8408-4341-a600-861d352e6935",
        "user_id": "52e12edf-8408-4341-a600-861d352e6935"
    },
    {
        "name": "Makena",
        "user_id": "1"
    },
    {
        "name": "Allan",
        "user_id": "2"
    }
]

async function submitComment(comment: string) {
    if (comment === '') return alert('Please enter a comment before submitting')
    const {data: db_user} = await useFetch(`/api/user/${user.value.user_id}`)

    if (db_user?.value?.statusCode !== 200) {
        alert('An error occurred; refreshing the page | if persist, clear cookies')
        setTimeout(() => {
            location.reload()
        }, 1000)

        return
    }
    // prepend name to comment
    comment = `${db_user.value.body?.data?.name || db_user.value.body?.data?.user_id} : ${comment}`
    // console.log(comment)

    const {data: response} = await useFetch(`/api/tickets/${props.ticket.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({
            comment: comment,
            commentor: user.value.user_id,
            parentId: null
        })
    })

    if (response?.value?.statusCode !== 200) {
        alert('An error occurred')
        console.log(response?.value?.body)

        return
    }
    // console.log(response.value.body)
    console.log('Comment submitted successfully')

    // wait for 1 second before reloading the page
    setTimeout(() => {
        // if comment is not in the list, add it
        if (!props.ticket.comments.includes(response?.value?.body?.data as Comment)) {
            props.ticket.comments.unshift(response?.value?.body?.data as Comment)

            setTimeout(() => {
                if (useWsServerStatus().value !== SocketStatus.OPEN) {
                    location.reload()
                }
            }, 500)
        }
    }, 500)
}

async function getUserName(user_id: string) {
    const res = await $fetch(`/api/user/${user_id}`)

    // if (res?.statusCode === 200) {
    //     // console.log(res.body.data)
    //     userName.value = res.body?.data?.name || res.body?.data?.user_id
    // }
    //
    // userName.value = user_id
    return res.body?.data?.name || res.body?.data?.user_id
}

userName.value = await getUserName(props.ticket.user_id)


watch(useWsServerStatus(), value => {
    if (value !== SocketStatus.OPEN) {
        let poll = setInterval(async () => {
            if (useWsServerStatus().value === SocketStatus.OPEN) {
                clearInterval(poll)
            } else {
                let new_ticket = await $fetch(`/api/tickets/${props.ticket.id}`)
                local_ticket.value.comments = new_ticket.body?.data?.comments
            }
        }, 1000)
    }
})

watch(useNewTicketComment(), value => {
    if (value) {
        if (value.ticketId === props.ticket.id) {
            local_ticket.value.comments.unshift(value.comment)
        }
    }
})

watch(useCommentActions(), value => {
    if (value) {
        if (value.action === CommentAct.DELETE && value.ticket.id === props.ticket.id) {
            local_ticket.value.comments = local_ticket.value.comments.filter((comment: Comment) => comment.id !== value.commentId)
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