<template>
  <Head>
    <Title>Home</Title>
  </Head>
  <main class="main">
    <div class="container">
      <div class="columns">
        <SideNav/>
        <div class="column is-9">
          <section class="hero is-info welcome is-small" id="hero">
            <div class="hero-body">
              <div class="container">
                <Call/>
              </div>
              <div class="container">
                <h1 class="title">
                  Hello <client-only>{{name}}</client-only>
                </h1>
                <h2 class="subtitle">
                  You have <client-only>{{ notifications?.length }}</client-only> new notifications
                </h2>
              </div>
            </div>
          </section>
          <section class="info-tiles">
            <div class="tile is-ancestor has-text-centered">
              <NuxtLink class="tile is-parent"
                        :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.O })}`)}`">
                <article class="tile is-child box">
                  <p class="title">{{ ticketsMetaDataState.new_count }}</p>
                  <p class="subtitle">New Tickets</p>
                </article>
              </NuxtLink>
              <NuxtLink class="tile is-parent"
                        :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.P })}`)}`">
                <article class="tile is-child box">
                  <p class="title">{{ ticketsMetaDataState.pending_count }}</p>
                  <p class="subtitle">Pending Tickets</p>
                </article>
              </NuxtLink>
              <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: STATUS.R })}`)}`"
                        class="tile is-parent">
                <article class="tile is-child box">
                  <p class="title">{{ ticketsMetaDataState.resolved_count }}</p>
                  <p class="subtitle">Resolved</p>
                </article>
              </NuxtLink>
              <NuxtLink class="tile is-parent"
                        :to="`${encodeURI(`tickets/${JSON.stringify({ ticket_filter: STATUS.C })}`)}`">
                <article class="tile is-child box">
                  <p class="title">{{ ticketsMetaDataState.exceptions_count }}</p>
                  <p class="subtitle">Closed</p>
                </article>
              </NuxtLink>
            </div>
          </section>
          <div class="columns">
            <div class="column is-6">
              <div class="card events-card">
                <header class="card-header">
                  <p class="card-header-title">
                    New Tickets
                  </p>
                  <a href="#" class="card-header-icon" aria-label="more options">
                                        <span class="icon">
                                            <i class="fa fa-angle-down" aria-hidden="true"></i>
                                        </span>
                  </a>
                </header>
                <div class="card-table">
                  <div class="content">
                    <table class="table is-fullwidth is-striped">
                      <tbody>
                      <tr v-for="(item, index) in tickets" :key="index">
                        <td width="5%"><i class="fa fa-bell-o"></i></td>
                        <td>{{ item.issue }}</td>
                        <td>{{ item.reference }}</td>
                        <td class="level-right">
                          <NuxtLink class="button is-small is-primary"
                                    :to="`tickets/view/${item.id}`" @click="pendTicket(item.id)">
                            View
                          </NuxtLink>
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="card-footer">
                  <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: 'None' })}`)}`"
                            class="card-footer-item">
                    View All
                  </NuxtLink>
                </div>
              </div>
            </div>
            <div class="column is-6">
              <div class="card">
                <header class="card-header">
                  <p class="card-header-title">
                    Ticket Search
                  </p>
                  <a href="#" class="card-header-icon" aria-label="more options">
                                        <span class="icon">
                                            <i class="fa fa-angle-down" aria-hidden="true"></i>
                                        </span>
                  </a>
                </header>
                <form class="card-content" @submit.prevent="search">
                  <div class="content">
                    <div class="control has-icons-left has-icons-right">
                      <input class="input" type="text"
                             placeholder="Enter Transaction Code or Reference"
                             v-model="search_transaction_code_or_reference">
                      <span class="icon is-medium is-left">
                                                <i class="fa fa-search"></i>
                                            </span>
                      <span class="icon is-medium is-right">
                                                <i class="fa fa-check"></i>
                                            </span>
                    </div>
                  </div>
                </form>
              </div>
              <div class="card">
                <header class="card-header">
                  <p class="card-header-title">
                    User Search
                  </p>
                  <a href="#" class="card-header-icon" aria-label="more options">
                                        <span class="icon">
                                            <i class="fa fa-angle-down" aria-hidden="true"></i>
                                        </span>
                  </a>
                </header>
                <form class="card-content" @submit.prevent="search">
                  <div class="content">
                    <div class="control has-icons-left has-icons-right">
                      <input class="input" type="text" placeholder="Enter Email or Name(s)"
                             v-model="email_or_name">
                      <span class="icon is-medium is-left">
                                                <i class="fa fa-search"></i>
                                            </span>
                      <span class="icon is-medium is-right">
                                                <i class="fa fa-check"></i>
                                            </span>
                    </div>
                  </div>
                </form>
              </div>
              <div class="card">
                <header class="card-header">
                  <p class="card-header-title">
                    Search Date Range
                  </p>
                  <a href="#" class="card-header-icon" aria-label="more options">
                                        <span class="icon">
                                            <i class="fa fa-angle-down" aria-hidden="true"></i>
                                        </span>
                  </a>
                </header>
                <form class="card-content" @submit.prevent="search">
                  <div class="content">
                    <div class="control lighten">
                      From:
                      <input class="input lighten" type="date" v-model="search_date_from">
                    </div>
                    <div class="control lighten">
                      To:
                      <input type="date" class="input lighten" v-model="search_date_to">
                    </div>
                  </div>
                  <button class="button lighten">
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<script setup lang="ts">
import {SearchQuery, STATUS} from "~/types";
import {
  updateNewTickets,
  updateTicketsMetaData,
  onNewTicketCallback,
  onUpdateTicketCallback,
  onDeleteTicketCallback,
  getUserName
} from "~/helpers/clientHelpers";
import Call from "~/components/Chat/Call.vue";
import {Ticket} from "@prisma/client";

const tickets = ref<Ticket[]>([])
const ticketsMetaDataState = ref({
  new_count: 0,
  pending_count: 0,
  resolved_count: 0,
  exceptions_count: 0,
})

const search_date_from = ref<Date | null>(null)
const search_date_to = ref<Date | null>(null)
const search_transaction_code_or_reference = ref('')
const email_or_name = ref('')

const user = useUser().value
const name = await getUserName(user.user_id)
const notifications = useNotifications()

async function pendTicket(id: any) {
  if (user.is_admin) {
    await useFetch(`/api/tickets/${id}/pend`)

    // @ts-ignore
    const ticket = tickets.value.find(ticket => ticket.id === id)
    if (ticket) {
      // @ts-ignore
      ticket.status = STATUS.P
    }
  }
}

async function search() {
  let query = {
    reference_number: search_transaction_code_or_reference.value,
    userNameOrEmail: email_or_name.value,
    date_from: search_date_from.value,
    date_to: search_date_to.value
  } as SearchQuery

  console.log(query)

  await navigateTo(`/tickets/search/${encodeURI(JSON.stringify(query))}`)
}

updateTicketsMetaData(ticketsMetaDataState.value)
updateNewTickets(tickets)

const socket = useGlobalSocket().value

if(socket){
  socket.onNewTicketCallback = (ticket: Ticket) => {
    onNewTicketCallback(ticket, tickets)
    updateTicketsMetaData(ticketsMetaDataState.value)
  }

  socket.onUpdateTicketCallback = (ticket: Ticket) => {
    onUpdateTicketCallback(ticket, tickets)
    updateTicketsMetaData(ticketsMetaDataState.value)
  }
}
</script>
<style scoped>
body {
  overflow-y: hidden;
}

.lighten {
  color: #8F99A3;
}
</style>
