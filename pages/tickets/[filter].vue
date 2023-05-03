<template>
    <Head>
        <Title>Tickets</Title>
    </Head>
    <main class="container">
        <div class="columns">
            <SideNav/>
            <div class="column">
                <Tickets :tickets="tickets"/>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {Ticket} from "@prisma/client";

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

async function getData(){
    let uriEncoded = encodeURI(`/api/tickets/query/${JSON.stringify(query)}`)
    const {data: response} = await useFetch(uriEncoded)

    // console.log(response.value.body.data)

    if (response.value !== null && response.value?.statusCode === 200){
        tickets.value = response.value.body.data
    }
}

getData()

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
</script>

<style scoped>

</style>