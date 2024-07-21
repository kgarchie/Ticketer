<template>

    <Head>
        <Title>Tickets</Title>
    </Head>
    <main class="container">
        <div class="columns">
            <SideNav />
            <div class="column">
                <Tickets :tickets="tickets" :onSearch="searchFilter" />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { type Ticket } from "@prisma/client";
import type { HttpResponseTemplate } from "~/types";

definePageMeta({
    middleware: ["auth"],
})

const route = useRoute()
const filter_json = route.params.filter
let parameters = JSON.parse(filter_json?.toString() || '{}')

const tickets = ref<Ticket[]>([])
let page = parameters.page || 0
let filter = parameters.ticket_filter || null

let query = {
    page: page,
    filter: filter
}

const { execute: getData } = await useFetch<HttpResponseTemplate>(encodeURI(`/api/tickets/query/${JSON.stringify(query)}`), {
    onResponse({ response }) {
        const data = response._data
        if (data && data.statusCode === 200) {
            tickets.value = data.body
        }
    }
})

onMounted(() => {
    const previousPage = document.getElementById('previous-page')
    const nextPage = document.getElementById('next-page')

    if (previousPage && nextPage) {
        previousPage.addEventListener('click', () => {
            if (page > 0) {
                page--
                query.page = page
                getData()
            }
        })

        nextPage.addEventListener('click', () => {
            page++
            query.page = page
            getData()
        })
    }
})


async function searchFilter(value: string) {
    if (!value) return
    const response = await $fetch<HttpResponseTemplate>(`/api/tickets/search/${value}`)
    if (response?.statusCode !== 200) console.warn(response.body)
    
    response.body.forEach((ticket: Ticket) => {
        if (!tickets.value.find((item: Ticket) => item.id === ticket.id)) {
            tickets.value.push(ticket)
        }
    })
}
</script>

<style scoped></style>