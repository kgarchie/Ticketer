<template>
    <Head>
        <title>My Tickets</title>
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
import {type Ticket} from "@prisma/client";
const user = useUser().value
const tickets = ref<Ticket[]>([])

if(user.user_id && user.user_id !== ''){
    const response = await $fetch(`/api/user/${user.user_id}/tickets`)

    tickets.value = response?.body

    // console.log(tickets.value)

    onMounted(() => {
        const filters = document.getElementById('filters')

        if (filters) {
            let links = filters.getElementsByTagName('a')

            for (let i = 0; i < links.length; i++) {
                links[i].addEventListener('click', (e) => {
                    e.preventDefault()
                })

                links[i].style.visibility = 'hidden'
            }
        }
    })
}
</script>

<style scoped>

</style>