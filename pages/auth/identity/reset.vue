<template>
    <Head to="head">
        <Title>Login</Title>
    </Head>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="reset">
                <div class="column sentence">
                    <strong>Enter the email you used to sign up</strong>
                </div>
                <div class="column ">
                    <label for="email">Email</label>
                    <input class="input is-primary" type="email" placeholder="Email address" autocomplete="email"
                           id="email" v-model="email" required>
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit" id="submit-btn">Register
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
const email = ref('')


const reset = () => {
    alert("Reset Email Sent")
}
</script>

<style scoped>

</style>