<template>
    <Html lang="en"/>
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
        <client-only>
            <div class="notification" v-if=" (notifications?.length > 0) ">
                <div class="is-flex notification-item" v-for=" notification  in  notifications.slice(-5)"
                     :key=" notification.id ">
                    <i class="fas fa-info-circle fa-2x"></i>
                    <div class="is-flex notification-body is-justify-content-space-between">
                        <strong>Notification: &nbsp;</strong><span
                            style="text-align: left">{{ notification.message }}</span>
                        <p class="ml-4">
                            <button class="button is-primary is-small"
                                    @click=" markNotificationAsRead(Number(notification?.id)) ">
                                Clear
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </client-only>
        <slot/>
        <Chat/>
    </section>
</template>
<script setup lang="ts">
import {SocketStatus, UserAuth} from "~/types";

const isActive = ref<boolean>(false)
const {$ClientWebSocket: ClientWebSocket} = useNuxtApp()

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

        // Remove notification from the list
        notifications.value = notifications.value.filter((notification) => notification.id != id.toString())
    } else {
        console.log(`Notification could not be marked as read | ${response?.value?.statusCode} | ${response?.value?.body}`)
    }
}

let opened_socket: any | undefined = undefined

onMounted(() => {
    if (user?.user_id != '') {
        opened_socket = new ClientWebSocket()

        // console.log(opened_socket.webSocket.readyState)
        // wait for 5 seconds and check if the socket is open
        setTimeout(() => {
            // console.log(opened_socket.webSocket.readyState)
            if (opened_socket.webSocket.readyState !== WebSocket.OPEN && opened_socket.webSocket.readyState !== WebSocket.CONNECTING) {
                useWsServerStatus().value = SocketStatus.CLOSED
                console.log('Socket flagged as closed')
            } else if (opened_socket.WebSocket === WebSocket.CONNECTING) {
                useWsServerStatus().value = SocketStatus.UNKNOWN
                console.log('Socket flagged as unknown')
            }
            console.log('Socket is open')
        }, 3000)

        // register service worker
        if ('serviceWorker' in navigator) {
            if (Notification.permission !== "granted") {
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        console.log("Notification permission granted.");
                    } else {
                        console.warn("Notification permission denied.");
                    }
                });
            }

            // navigator.serviceWorker.register('/sw.js')
            //     .catch((registrationError) => {
            //         console.log('Service worker registration failed: ', registrationError)
            //     })
        }
    } else {
        console.log('User is not available')
    }

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
