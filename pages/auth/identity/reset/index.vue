<template>
    <Head to="head">
        <Title>Reset</Title>
    </Head>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="reset">
                <div class="column sentence">
                    <strong>Enter your signup email</strong>
                </div>
                <div class="column ">
                    <label for="email">Email</label>
                    <input class="input is-primary" type="email" placeholder="Email address" autocomplete="email"
                           id="email" v-model="email" required>
                    <small><NuxtLink to="/auth/login" class="has-text-primary">Did you remember it?</NuxtLink></small>
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit" id="submit-btn">Reset
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
const email = ref('')
const user = useUser().value

const reset = async () => {
    if (email.value) {
        const btn = document.getElementById('submit-btn')
        btn?.classList.add('is-loading')

        const res = await $fetch('/api/auth/identity/reset', {
            method: 'POST',
            body: JSON.stringify(
                {
                    origin: window.location.origin,
                    email: email.value
                })
        })


        if (res?.statusCode === 200) {
            btn?.classList.remove('is-loading')
            setTimeout(() => {
                alert('Please check your email for a reset link')
            }, 1000)
            await navigateTo('/')
        } else {
            console.log(res.body)
        }
    }
}

</script>

<style scoped>

</style>