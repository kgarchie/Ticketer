<template>
    <Title>Login</Title>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="register">
                <div class="column">
                    <label for="email">Email</label>
                    <input class="input is-primary" type="email" placeholder="Email address" autocomplete="email"
                        id="email" v-model="data.email" required>
                </div>
                <div class="column">
                    <label for="name">Username</label>
                    <input class="input is-primary" type="text" placeholder="(Optional)" autocomplete="name" id="name"
                        :class="nameConfict ? 'is-danger' : ''" v-model="data.name" required  @input="checkUser"
                        ref="name">
                    <small class="has-text-danger" v-if="nameConfict">Username is already taken</small>
                </div>
                <div class="column">
                    <label for="Name">Password</label>
                    <input class="input is-primary" type="password" placeholder="Password" autocomplete="new-password"
                        ref="password" required>
                    <small class="has-text-danger hidden" ref="matchErrorHelp">Passwords Do Not Match</small>
                </div>
                <div class="column">
                    <label for="password">Password Again</label>
                    <input class="input is-primary" type="password" placeholder="Password" autocomplete="new-password"
                        v-model="data.password" required>
                    <NuxtLink class="is-size-7 has-text-primary" to="/auth/identity/reset">Forgot password?</NuxtLink>
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit" id="submit-btn" ref="submitBtn"
                        disabled>Register</button>
                </div>
                <div class="has-text-centered">
                    <p class="is-size-7">
                        Already have an account?
                        <NuxtLink to="/auth/login" class="has-text-primary">Log In</NuxtLink>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type RegisterCredentials } from "~/types";
import { debounce } from "perfect-debounce";
const nameConfict = ref(false);
const data = reactive({
    email: '',
    name: null,
    password: '',
    user_id: getAuthCookie()?.user_id
} as RegisterCredentials)

async function register() {
    const response = await $fetch('/api/auth/identity/register', {
        method: 'POST',
        body: {
            ...data,
            name: data.name || data.email.split('@')[0]
        } satisfies RegisterCredentials
    })

    if (response?.statusCode === 200) {
        await navigateTo("/")
    } else {
        alert(response.body)
        await navigateTo({ path: '/auth/identity/register' })
    }
}

const submitBtn = ref<HTMLButtonElement | null>(null);
const password = ref<HTMLInputElement | null>(null);
const matchErrorHelp = ref<HTMLSpanElement | null>(null);
watch(() => data.password, () => {
    if (data.password && data.password !== password.value?.value) {
        matchErrorHelp.value?.classList.remove("hidden")
    } else {
        matchErrorHelp.value?.classList.add("hidden")
        submitBtn.value ? submitBtn.value.disabled = !(data.password && data.email) : true
    }
})

const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
watch([() => data.name, () => data.email], () => {
    if (data.name && !usernameRegex.test(data.name)) {
        data.name = data.name.replace(/[^a-zA-Z0-9_]/g, '');
    } else if (data.name === null && data.email) {
        data.name = data.email.split('@')[0];
    }
})

const debouncedFetch = debounce(async () => {
        await $fetch(`/api/auth/find/${data.name}`, {
            onResponse({response}) {
                if(response._data.statusCode == 200){
                    nameConfict.value = true;
                } else {
                    nameConfict.value = false;
                }
            },
            onRequestError({error}) {
                console.error(error)
            },
            onResponseError({error}) {
                console.error(error)
            }
        })
    }, 500)

async function checkUser() {
    nameConfict.value = false;
    await debouncedFetch()
}
</script>

<style scoped>
small {
    font-size: 0.8rem;
}

.hidden {
    display: none;
}

.select {
    width: 100%;
    border-color: #00d1b2;
    box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
    max-width: 100%;
    background-color: white;
    border-radius: 4px;
    color: #363636;
    height: auto;

    padding: 11px 5px;
}

.select:focus {
    box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
    outline: #00c4a7;
}
</style>