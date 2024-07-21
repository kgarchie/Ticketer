<template>

    <Head to="head">
        <Title>Login</Title>
    </Head>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="submitNewPassword">
                <div class="column">
                    <label for="Name">Password</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                        autocomplete="current-password" id="password" v-model="password1">
                    <small class="has-text-danger hidden" ref="passwordError">Passwords Do Not Match</small>
                </div>
                <div class="column mb-5">
                    <label for="Name">Password Confirmation</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                        autocomplete="current-password" id="password" v-model="password2">
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit" ref="submitBtn" disabled>Proceed</button>
                </div>
                <div class="has-text-centered">
                    <p class="is-size-7"> Don't have an account?
                        <NuxtLink to="/auth/identity/register" class="has-text-primary">Sign up</NuxtLink>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
// separate email and user id from user using split('&')
const link_parameter = route.params.token
const details_string = link_parameter.toString().split('&')
const user_id = details_string[0]
const email = details_string[1]
const token = link_parameter?.slice(user_id.length + email.length + 2)
const password1 = ref('')
const password2 = ref('')
const passwordError = ref<HTMLElement | null>(null)
const submitBtn = ref<HTMLElement | null>(null)

async function submitNewPassword() {
    if (email && password1.value && user_id) {
        const res = await $fetch('/api/auth/identity/new', {
            method: 'POST',
            body: {
                user_id: user_id,
                email: email,
                token: token,
                password: password1.value
            }
        })

        if (res?.statusCode === 200) {
            window.location.href = '/'
        } else {
            alert(res.body)
        }
    } else {
        alert('Please fill in all fields')
    }
}

watch([password1, password2], () => {
    if (password2.value && password1.value !== password2.value) {
        passwordError.value?.classList.remove("hidden")
    } else if (password2.value && password1.value === password2.value) {
        passwordError.value?.classList.add("hidden")
        submitBtn.value?.removeAttribute('disabled')
    }
})
</script>

<style scoped>
.hidden {
    visibility: hidden;
}
</style>