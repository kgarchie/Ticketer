<template>
    <div class="content box">
        <p>
            <strong>{{ comment?.comment.split(' : ')[0] }}</strong>
            <br>
            <span v-html="parseComment(comment?.comment.split(' : ')[1])"></span>
            <br>
            <small>
                <a @click.prevent="showReplyForm(comment)">Reply</a> · <a
                    v-if="comment?.commentor.toString() === user.user_id" @click.prevent="deleteComment(comment)">Delete
                ·
            </a>
                {{ formatDate(comment?.createdAt) }}
            </small>
        </p>
        <TicketCommentForm v-if="comment === commentToReply" @comment="submitComment" @cancel="cancelReplyForm"
                           :taggable="taggable_computed"/>
        <div v-if="(comment.children && comment?.children.length > 0)">
            <TicketCommentList v-for="child in comment?.children" :key="child.id" :comment="child"
                               :ticket="ticket" :taggable="taggable_computed"/>
        </div>
    </div>
</template>
<script setup lang="ts">
import {SocketStatus, type TaggedPerson} from "~/types";

const user = useUser()

const props = defineProps({
    comment: {
        type: Object,
        required: true
    },
    ticket: {
        type: Object,
        required: true
    },
    taggable: {
        type: Array as PropType<TaggedPerson[]>,
        required: false
    }
})

// console.log(props.taggable)
const taggable_computed = computed(() => props.taggable)


if (props.comment) {
    props.comment.children = computed(() => {
        // console.log(props.ticket.comments)
        return props.ticket.comments.filter((comment: any) => comment?.parentId === props?.comment?.id)
    })
    // console.log(props.comment.children)
}

let commentToReply = ref<Comment | null>(null)

function showReplyForm(comment: any) {
    commentToReply.value = comment
}

function cancelReplyForm() {
    commentToReply.value = null
}

let oldComment = ''

async function submitComment(payload: any) {
    let {comment, tagged} = payload
    if (comment === '') return alert('Please enter a comment before submitting')
    const {data: db_user} = await useFetch(`/api/user/${user.value.user_id}`)

    if (db_user?.value?.statusCode === 200 && oldComment !== comment) {
        // prepend name to comment
        // @ts-ignore
        comment = `${db_user.value.body} : ${comment}`
        // console.log(comment)

        const {data: response} = await useFetch(`/api/tickets/${props.ticket.id}/comment`, {
            method: 'POST',
            body: {
                comment: comment,
                commentor: user.value.user_id,
                parentId: commentToReply?.value?.id || null,
                tagged: tagged.value as TaggedPerson[]
            }
        })

        if (response?.value?.statusCode !== 200) {
            console.log(response.value?.body)
            alert('An error occurred')
        } else {
            let comment = response?.value?.body

            // console.log(comment)

            // if comment doesn't exist in comments array, add it
            if (useSocket().value?.status !== SocketStatus.OPEN) {
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
        console.log('Double submission')
    } else {
        alert('An error occurred; try refreshing the page')
    }

    commentToReply.value = null
}

async function deleteComment(comment: any) {
    const {data: response} = await useFetch(`/api/tickets/${props.ticket.id}/comment/delete`, {
        method: 'POST',
        body: {commentId: comment.id}
    })

    if (response?.value?.statusCode !== 200) {
        alert('An error occurred')
        console.log(response?.value?.body)
    } else {
        setTimeout(async () => {
            if (props.ticket.comments.find((c: any) => c.id === comment.id)) {
                window.location.reload()
            } else {
                console.log('comment deleted via websocket')
            }
        }, 500);
    }
}

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString()
}

function parseComment(comment: string) {
    const regex = /@(\w+)/g
    return comment.replace(regex, '<a href="/user/$1">@$1</a>')
}

</script>
<style scoped>
.box {
    box-shadow: inset 0 0 0 1px #ccc;
}
</style>