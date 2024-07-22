<template>
  <Html lang="en" />
  <Link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
            <NuxtLink :to="`${encodeURI(`/tickets/${JSON.stringify({ ticket_filter: null })}`)}`" class="navbar-item">
              Tickets
            </NuxtLink>
          </div>
          <div class="navbar-end">
            <div class="navbar-item">
              <div class="buttons" v-if="!userIsAuthenticated()">
                <NuxtLink class="button is-primary" to="/auth/identity/register" style=":hover{color: black;}"
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
            </div>
          </div>
        </div>
      </div>
    </nav>
    <div class="notification" v-if="(notifications?.length > 0)">
      <div class="is-flex notification-item" v-for="notification in notifications.slice(-5)" :key="notification.id">
        <div class="is-flex notification-body is-justify-content-space-between">
          <i class="fas fa-info-circle fa-2x"></i>
          <strong>Notification: &nbsp;</strong><span style="text-align: left">{{ notification.message }}</span>
          <p class="ml-4">
            <button class="button is-primary is-small" @click="markNotificationAsRead(Number(notification?.id))">
              Clear
            </button>
          </p>
        </div>
      </div>
    </div>
    <slot />
    <Chat />
  </section>
</template>
<script setup lang="ts">
import { TYPE, type HttpResponseTemplate, type SocketTemplate, type UserAuth } from "~/types"
import type { Notification } from "@prisma/client";
import { onNotificationCallback } from "~/helpers/clientHelpers"

// const {$ECall: ECall} = useNuxtApp()
// const callState = useCall()

const isActive = ref<boolean>(false)
const user = useCookie<UserAuth>("auth").value
const notifications = useNotifications()

async function logout() {
  const { data: response } = await useFetch('/api/auth/logout')
  if (response?.value?.statusCode !== 200) {
    useCookie<UserAuth | undefined>('auth').value = {
      auth_key: null,
      is_admin: false,
      user_id: ''
    } as UserAuth
  }
  window.location.href = '/auth/login'
}

async function markNotificationAsRead(id: any) {
  const { data: response } = await useFetch(`/api/notifications/${id.toString()}/read`)
  if (response?.value?.statusCode == 200) {
    console.log('Notification marked as read')
    notifications.value = notifications.value.filter((notification: Notification) => notification.id.toString() != id.toString())
  } else {
    console.log(`Notification could not be marked as read | ${response?.value?.statusCode} | ${response?.value?.body}`)
  }
}

async function chime(body: string) {
  if (document.hasFocus()) return
  const audio = new Audio(`${window.location.origin}/notification.mp3`)
  audio.play()
  if (window.Notification.permission === 'granted') {
    new Notification('Notification', {
      body: body
    })
  } else {
    window.Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification('Notification', {
          body: body,
        })
      } else {
        console.warn("Notification permission denied.");
      }
    })
  }
}

const socket = useSocket().value
socket?.on("data", (data: any) => {
  const _data = parseData(data) as SocketTemplate<Notification>
  switch (_data.type) {
    case TYPE.NEW_MESSAGE_NOTIFICATION:
    case TYPE.NOTIFICATION:
      onNotificationCallback(_data.body!, notifications)
      chime(_data.body!.message)
      break
  }
})

const { data } = await useFetch<HttpResponseTemplate>("/api/notifications", {
  headers: {
    "Authorization": `User ${user.user_id}`
  }
})

notifications.value = data.value?.body

onMounted(async () => {
  const nav = document?.getElementById('navMenu')
  // @ts-ignore
  const a_nav = Array.from(nav?.getElementsByTagName('a'))
  a_nav.forEach((a) => {
    a.addEventListener('click', () => {
      isActive.value = !isActive.value
    })
  })

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
})
</script>
<style scoped lang="scss">
.notification {
  all: unset;
  position: absolute;
  top: 2%;
  z-index: 10000;
  transform: translate(-50%, 0);
  transition: top 1s ease-in-out;
  left: 50%;

  .notification-item {
    margin: 10px 0;
    display: flex;
    align-items: center;
  }

  .notification-body {
    background-color: #fff;
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    position: relative;
    display: flex;
    align-items: center;

    i {
      font-size: 1rem;
    }

    .notification-close {
      top: -300px;

      transition: top 1s ease-in-out;
    }
  }
}
</style>
