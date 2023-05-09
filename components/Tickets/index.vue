<template>
    <div class="panel">
        <div class="panel-heading">
            Tickets
        </div>
        <div class="panel-block">
            <p class="control has-icons-left">
                <input class="input" type="text" placeholder="Search">
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
                    <NuxtLink
                            :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.O })}`)}`">
                        <span>New</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink
                            :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.P })}`)}`">
                        <span>Pending</span>
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                            :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.R })}`)}`">
                        <span>Resolved</span>
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.C })}`)}`">
                        <span>Exceptions</span>
                    </NuxtLink>
                </li>
            </ul>
        </div>
        <div class="panel-block is-flex is-justify-content-center is-flex-direction-column">
            <div class="table-container">
                <table class="table is-bordered is-striped is-fullwidth is-hoverable is-fullwidth">
                    <thead>
                    <tr>
                        <th>Action</th>
                        <th>View</th>
                        <th>Paybill</th>
                        <th>Issue</th>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Safaricom</th>
                        <th>Airtel</th>
                        <th>Urgency</th>
                    </tr>
                    </thead>
                    <tbody class="is-vcentered">
                    <tr v-for="item in tickets" :key="item.id">
                        <td>
                            <button class="button is-success mr-1" @click="resolveTicket(item.id)"
                                    v-if="item.status !== STATUS.R">✓
                            </button>
                            <button class="button is-success mr-1" disabled v-else>✓</button>
                            <button class="button is-warning mr-1" @click="closeTicket(item.id)"
                                    v-if="item.status !== STATUS.C">𐌗
                            </button>
                            <button class="button is-warning mr-1" disabled v-else>𐌗</button>
                        </td>
                        <td>
                            <NuxtLink :to="`/tickets/view/${item.id}`">View</NuxtLink>
                        </td>
                        <td>{{ item.paybill_no }}</td>
                        <td>{{ item.issue }}</td>
                        <td>{{ item.reference }}</td>
                        <td>{{ item.amount }}</td>
                        <td>{{ item.transaction_date.split('T')[0] }}</td>
                        <td>{{ item.safaricom_no }}</td>
                        <td>{{ item.airtel_no }}</td>
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
import {STATUS} from "~/types";
import {Ticket} from "@prisma/client";

const user = useUser().value

const props = defineProps({
    tickets: {
        type: Array as PropType<Ticket[]>,
        required: false,
        default: []
    }
})


async function closeTicket(id: number) {
    if (user.is_admin) {
        const {data: response} = await useFetch(`/api/tickets/${id}/close`)

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
        const {data: response} = await useFetch(`/api/tickets/${id}/resolve`)

        // update the ticket status
        if (response?.value?.statusCode === 200) {
            const ticket = props.tickets.find(ticket => ticket.id === id)
            if (ticket) {
                ticket.status = STATUS.R
            }
        }
    } else {
        alert('You are not authorized to perform this action')
    }
}
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