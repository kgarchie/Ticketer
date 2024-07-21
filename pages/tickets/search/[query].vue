<script setup lang="ts">
const route = useRoute()
const query = decodeURI(route.params.query as string)
const tickets = ref([])

definePageMeta({
  middleware: ["auth"],
})

const {data: res} = await useFetch('/api/tickets/search', {
    method: 'POST',
    body: query
})

const response = res.value

if (response && response.statusCode === 200) {
    tickets.value = response.body
} else {
    alert(response?.body)
}

onMounted(() => {
    const filter = document.querySelectorAll('.filter')
    const pagination = document.querySelector('.pagination')
    if (filter && pagination) {
        pagination.remove()
        filter.forEach(el => el.remove())
    }
})
</script>

<template>
    <Title>Search Results</Title>
    <main class="container">
        <div class="columns">
            <SideNav/>
            <div class="column">
                <Tickets :tickets="tickets"/>
            </div>
        </div>
    </main>
</template>

<style scoped>
</style>