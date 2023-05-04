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
const route = useRoute()
const tickets_json_string = route.params.results
let tickets = JSON.parse(tickets_json_string?.toString() || '{}')

console.log(tickets)
</script>

<style scoped>

</style>