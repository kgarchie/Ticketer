<template>
    <Head to="head">
        <Title>Login</Title>
    </Head>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="login">
                <div class="column">
                    <label for="email">Email</label>
                    <input class="input is-primary" type="text" placeholder="Email address" autocomplete="email"
                           id="email" v-model="email">
                    <small class="help is-danger" :class="{'not_active': success}">Wrong Email/Password</small>
                </div>
                <div class="column">
                    <label for="Name">Password</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                           autocomplete="current-password" id="password" v-model="password">
                    <NuxtLink to="/auth/identity/reset" class="is-size-7 has-text-primary">Forgot password?</NuxtLink>
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit">Login</button>
                </div>
                <div class="has-text-centered">
                    <p class="is-size-7"> Don't have an account? <NuxtLink to="/auth/identity/register" class="has-text-primary">Sign up</NuxtLink>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import {LoginCredentials} from "~/types";

const email = ref('')
const password = ref('')
const success = ref(true)

const login = async () => {
    const {data: response} = await useFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: email.value,
            password: password.value
        } as LoginCredentials)
    })

    if(response.value?.statusCode === 200) {
        window.location.href = '/'
    } else {
        success.value = false
        console.log(response.value)
    }
}
</script>

<style scoped>

</style>