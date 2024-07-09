<template>
  <Html lang="en"/>
  <Link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <section>
    <nav class="navbar nav is-white">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item brand-text" href="/">
            Ticketer
          </a>
          <div class="navbar-burger burger" data-target="navMenu" :class="{ 'is-active': isActive }"
               @click="isActive = !isActive">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div id="navMenu" class="navbar-menu" :class="{ 'is-active': isActive }">
          <div class="navbar-start">
            <NuxtLink to="/" class="navbar-item">
              Home
            </NuxtLink>
            <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`"
                      class="navbar-item">
              Tickets
            </NuxtLink>
          </div>
          <div class="navbar-end">
            <div class="navbar-item">
              <client-only>
                <div class="buttons" v-if="!is_authenticated">
                  <NuxtLink class="button is-primary" to="/auth/identity/register"
                            style=":hover{color: black;}"
                            @click="isActive = !isActive">
                    <strong>Sign up</strong>
                  </NuxtLink>
                  <NuxtLink class="button is-light" to="/auth/login" @click="isActive = !isActive">
                    Log in
                  </NuxtLink>
                </div>
                <div class="buttons" v-else>
                  <a class="button is-primary" type="button" @click="logout(); isActive = !isActive">
                    <strong>Log out</strong>
                  </a>
                </div>
              </client-only>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <div class="notification" v-if=" (notifications?.length > 0) ">
      <div class="is-flex notification-item" v-for="notification  in  notifications.slice(-5)"
           :key="notification.id">
        <i class="fas fa-info-circle fa-2x"></i>
        <div class="is-flex notification-body is-justify-content-space-between">
          <strong>Notification: &nbsp;</strong><span
            style="text-align: left">{{ notification.message }}</span>
          <p class="ml-4">
            <button class="button is-primary is-small"
                    @click="markNotificationAsRead(Number(notification?.id)) ">
              Clear
            </button>
          </p>
        </div>
      </div>
    </div>
    <slot/>
    <Chat/>
  </section>
</template>
<script setup lang="ts">
import {type UserAuth} from "~/types"
import type {Notification} from "@prisma/client";
import {onNotificationCallback, updateNotifications} from "~/helpers/clientHelpers"

// const {$ECall: ECall} = useNuxtApp()
// const callState = useCall()

const isActive = ref<boolean>(false)
const user = useUser().value
const notifications = useNotifications()

const is_authenticated = ref<boolean>(false)
is_authenticated.value = !(user?.auth_key == '' || user?.auth_key == null)

async function logout() {
  const {data: response} = await useFetch('/api/auth/logout')
  if (response?.value?.statusCode !== 200) {
    let cookie = useCookie<UserAuth | undefined>('auth').value = {
      auth_key: null,
      is_admin: false,
      user_id: ''
    } as UserAuth
    console.log(cookie)
    is_authenticated.value = false
  }
  window.location.href = '/auth/login'
}

async function markNotificationAsRead(id: any) {
  const {data: response} = await useFetch(`/api/notifications/${id.toString()}/read`)
  if (response?.value?.statusCode == 200) {
    console.log('Notification marked as read')
    notifications.value = notifications.value.filter((notification: Notification) => notification.id.toString() != id.toString())
  } else {
    console.log(`Notification could not be marked as read | ${response?.value?.statusCode} | ${response?.value?.body}`)
  }
}

// if (process.client) callState.value = new ECall(user)

const socket = useGlobalSocket().value

if (socket) {
  socket.onNotificationCallback = (_notification: Notification) => {

    if (process.client && 'serviceWorker' in navigator) {
      if (window.Notification.permission !== "granted") {
        window.Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted.");
          } else {
            console.warn("Notification permission denied.");
          }
        });
      }

      navigator.serviceWorker.register('/sw.js')
          .catch((registrationError) => {
            console.log('Service worker registration failed: ', registrationError)
          })
    }

    onNotificationCallback(_notification, notifications)
  }
}

onMounted(() => {
  updateNotifications(notifications, user.user_id)

  const nav = document?.getElementById('navMenu')
  // @ts-ignore
  const a_nav = Array.from(nav?.getElementsByTagName('a'))
  a_nav.forEach((a) => {
    a.addEventListener('click', () => {
      isActive.value = !isActive.value
    })
  })
})
</script>
<style scoped>

</style>
