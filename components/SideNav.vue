<template>
  <div class="column is-2">
    <aside class="menu is-hidden-mobile is-flex is-flex-direction-column">
      <p class="menu-label">
        General
      </p>
      <ul class="menu-list">
        <li>
          <NuxtLink to="/">Dashboard</NuxtLink>
        </li>

        <li>
          <NuxtLink to="/tickets/create">New Ticket</NuxtLink>
        </li>

        <li>
          <NuxtLink to="/tickets/view/user">My Tickets</NuxtLink>
        </li>

        <client-only>
          <li v-if="user.is_admin">
            <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ticket_filter: null})}`)}`">All Site Tickets
            </NuxtLink>
          </li>
        </client-only>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
const user = useUser()
</script>

<style scoped>

</style>