<template>
    <div class="panel">
        <div class="panel-heading">
            Tickets
        </div>
        <div class="panel-block">
            <p class="control has-icons-left">
                <input class="input" type="text" placeholder="Search" v-model="search">
            </p>
        </div>
        <div class="panel-block tabs is-centered is-boxed">
            <ul id="filters">
                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`">
                        <span>All</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.O })}`)}`"
                        class="filter">
                        <span>New</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.P })}`)}`"
                        class="filter">
                        <span>Pending</span>
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.R })}`)}`"
                        class="filter">
                        <span>Resolved</span>
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.C })}`)}`"
                        class="filter">
                        <span>Closed</span>
                    </NuxtLink>
                </li>
            </ul>
        </div>
        <div class="panel-block is-flex is-justify-content-center is-flex-direction-column">
            <div class="table-container" style="width: 95%;">
                <table class="table is-bordered is-striped is-fullwidth is-hoverable is-fullwidth">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>View</th>
                            <th>Reference</th>
                            <th>Issue</th>
                            <th>Date</th>
                            <th>Urgency</th>
                        </tr>
                    </thead>
                    <tbody class="is-vcentered">
                        <tr v-for="item in tickets" :key="item.id">
                            <td class="is-flex">
                                <button class="button is-success mr-1" @click="resolveTicket(item.id)"
                                    :disabled="item.status === STATUS.R">✓
                                </button>
                                <button class="button is-warning mr-1" @click="closeTicket(item.id)"
                                    :disabled="item.status === STATUS.C">𐌗
                                </button>
                            </td>
                            <td>
                                <NuxtLink :to="`/tickets/view/${item.id}`">View</NuxtLink>
                            </td>
                            <td>{{ item.reference }}</td>
                            <td>{{ item.info.slice(0, 30) }}...</td>
                            <td>{{ new Date(item.created_at).toLocaleDateString() }}</td>
                            <td>{{ item.urgency }}</td>
                        </tr>
                    </tbody>
                </table>

            </div>
            <nav class="pagination is-centered" role="navigation" aria-label="pagination">
                <a class="pagination-previous" id="previous-page">Previous</a>
                <a class="pagination-next" id="next-page">Next</a>
            </nav>
        </div>
    </div>
</template>
<script setup lang="ts">
import { STATUS, TYPE, type SocketTemplate } from "~/types";
import { type Ticket } from "@prisma/client";

const user = useUser().value
const search = ref('')

const props = defineProps({
    tickets: {
        type: Array as PropType<Ticket[]>,
        required: false,
        default: []
    }
})

props.tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
async function closeTicket(id: number) {
    if (user.is_admin) {
        const { data: response } = await useFetch(`/api/tickets/${id}/close`, {
            method: 'POST'
        })

        // update the ticket status
        if (response?.value?.statusCode === 200) {
            const ticket = props.tickets.find(ticket => ticket.id === id)
            if (ticket) {
                ticket.status = STATUS.C
            }
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

async function resolveTicket(id: number) {
    if (user.is_admin) {
        const { data: response } = await $fetch(`/api/tickets/${id}/resolve`, {
            method: 'POST'
        })

        if (response?.statusCode === 200) {
            const ticket = props.tickets.find(ticket => ticket.id === id)
            if (ticket) {
                ticket.status = STATUS.R
            }
        } else {
            alert('A problem occurred while trying to resolve the ticket')
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}

const emit = defineEmits(['search'])

watch(() => search.value, (value) => {
    emit('search', value)
})

const socket = useSocket().value
socket?.on("data", (data: SocketTemplate) => {
    if (data.type === TYPE.DELETE_TICKET) {
        const ticket = data.body as Ticket
        const index = props.tickets.findIndex(item => item.id === ticket.id)
        if (index !== -1) {
            props.tickets.splice(index, 1)
        }
        console.log('ticket deleted')
    }
})
</script>
<style scoped>
.router-link-active {
    background-color: #fff;
    color: #485fc7 !important;
    border: 1px solid #dbdbdb !important;
    border-radius: 4px 4px 0 0;
    border-bottom: transparent !important;
}
</style>