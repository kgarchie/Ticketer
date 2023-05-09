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
                    <small class="has-text-danger hidden" id="no-match">Passwords Do Not Match</small>
                </div>
                <div class="column mb-5">
                    <label for="Name">Password Confirmation</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                           autocomplete="current-password" id="password" v-model="password2">
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit">Proceed</button>
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
const token = details_string[0]
const user_id = details_string[1]
const email = details_string[2]
const password1 = ref('')
const password2 = ref('')

async function submitNewPassword() {
    if (email && password1.value && user_id) {
        const {data: res} = await useFetch('/api/auth/identity/new', {
            method: 'POST',
            body: {
                user_id: user_id,
                email: email,
                token: token,
                password: password1.value
            }
        })

        if (res.value?.statusCode === 200) {
            window.location.href = '/'
        } else {
            alert('Something went wrong, please try again')
        }
    } else {
        alert('Please fill in all fields')
    }
}

onMounted(() => {
    const submitBtn = document?.getElementById('submit-btn')
    submitBtn?.setAttribute('disabled', 'true')

    watch([password1, password2], () => {
        if (password2.value && password1.value !== password2.value) {
            document.getElementById('no-match')?.classList.remove("hidden")
            console.log(password1.value, password2.value)
        } else if (password2.value && password1.value === password2.value) {
            document.getElementById('no-match')?.classList.add("hidden")
            submitBtn?.removeAttribute('disabled')
        }
    })
})
</script>

<style scoped>
.hidden {
    visibility: hidden;
}
</style>