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
import type { UserAuth } from "~/types";
const user = useCookie<UserAuth>("auth").value
const tickets = ref<Ticket[]>([])

definePageMeta({
  middleware: ["auth"],
})

if(user.user_id){
    const response = await $fetch(`/api/user/${user.user_id}/tickets`)
    tickets.value = response?.body
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