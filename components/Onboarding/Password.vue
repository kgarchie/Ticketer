<template>
    <form class="onboarding mt-2">
        <div class="field">
            <label for="password" class="label">Password</label>
            <input type="password" id="password" class="input" placeholder="woopidiscoop" v-model="password" />
        </div>
        <div class="field mt-2">
            <label for="confirmPassword" class="label">Confirm Password</label>
            <input type="password" id="confirmPassword" class="input" placeholder="scoopididiwoop" v-model="confirmPassword" />
            <small class="help is-danger" v-if="password !== confirmPassword">Passwords must match</small>
        </div>
        <button type="submit" class="button is-primary is-fullwidth" @submit="submitPassword">Next</button>
    </form>
</template>
<script setup lang="ts">
const password = ref('');
const confirmPassword = ref('');

const emit = defineEmits<{
    data: [string]
}>()

function submitPassword() {
    if(password.value !== confirmPassword.value) {
        useNotifications().value.push({
            id: 0,
            message: "Passwords do not match",
            opened: false
        })
        return
    }

    emit('data', password.value)
}
</script>