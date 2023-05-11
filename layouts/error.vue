<template>
    <div class="container">
        <div class="columns is-centered">
            <div class="column is-half">
                <div class="message is-danger">
                    <div class="message-header">
                        <p>Oops! An error has occurred.</p>
                    </div>
                    <div class="message-body">
                        <p v-if="error">{{ error }}</p>
                        <p v-else>Sorry, something went wrong or page may have moved. Refresh the page of go back home</p>
                        <div class="buttons">
                            <button class="button is-danger" @click="refreshPage">Refresh</button>
                            <NuxtLink to="/" class="button is-primary">Home</NuxtLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
const  props = defineProps({
    error: {
        type: String,
        default: '',
    },
})

const refreshPage = () => {
    window.location.reload()
}
</script>

<style>
.container {
    padding-top: 6rem;
}
</style>