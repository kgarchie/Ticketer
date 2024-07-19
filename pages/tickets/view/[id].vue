<template>
    <Head>
        <title>Ticket Details</title>
    </Head>
    <main class="container">
        <div class="columns">
            <SideNav />
            <div class="column">
                <Ticket :ticket="ticket" />
            </div>
        </div>
    </main>
</template>
<script setup lang="ts">
const router = useRoute()
const id = router.params.id

definePageMeta({
  middleware: ["auth"],
})

const ticket = ref({})
const { data: response } = await useFetch(`/api/tickets/${id}`)

if (response?.value?.statusCode === 200) {
    ticket.value = response?.value?.body
    // console.log(ticket.value)
} else {
    console.log('No ticket found')
    if (process.client) {
        alert('Oops, That ticket doesn\'t exist')

        await navigateTo('/')
    }
}

</script>