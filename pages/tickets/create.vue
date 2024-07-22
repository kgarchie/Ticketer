<template>

    <Head>
        <Title>Create Ticket</Title>
    </Head>
    <main class="container">
        <div class="columns">
            <SideNav />
            <form method="post" class="column is-8 m-auto" @submit.prevent="createNewTicket" @reset="resetForm">
                <div class="card p-5">
                    <div class="field">
                        <label class="label">Message</label>
                        <div class="control">
                            <textarea class="textarea is-link" placeholder="Talk to us" v-model="data.text"></textarea>
                        </div>
                        <p class="help is-info">Required</p>
                    </div>
                    <div class="file has-name is-fullwidth">
                        <label class="file-label">
                            <input class="file-input" type="file" @change="createAttachment" multiple/>
                            <span class="file-cta">
                                <span class="file-icon">
                                    <i class="fas fa-upload"></i>
                                </span>
                                <span class="file-label"> Choose a file… </span>
                            </span>
                            <span class="file-name">{{ data.attachment.names.join(', ') }}</span>
                        </label>
                    </div>
                </div>

                <div class="is-flex is-justify-content-space-between is-align-items-center px-5">
                    <div class="field">
                        <label class="label">Elevation</label>
                        <div class="control">
                            <label class="radio">
                                <input type="radio" name="urgency" :value="URGENCY.U" v-model="data.elevation">
                                Urgent
                            </label>
                            <label class="radio">
                                <input type="radio" name="urgency" :value="URGENCY.E" v-model="data.elevation">
                                Emergency
                            </label>
                        </div>
                        <p class="help is-success">Optional</p>
                    </div>

                    <div class="field is-grouped">
                        <div class="control">
                            <button class="button is-link" type="submit"
                                :disabled="is_loading"
                                :class="{ 'is-loading': is_loading }">Submit</button>
                        </div>
                        <div class="control">
                            <button class="button is-link is-light" type="reset">Cancel</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </main>
</template>

<style scoped>
.my-select,
.my-select select {
    color: #363636;
    width: 100%;
}

.limited-form {
    max-width: 500px;
}
</style>

<script setup lang="ts">
import { ulid } from "ulid";
import {type HttpResponseTemplate, URGENCY} from "~/types";
const formData = new FormData()
const is_loading = ref(false)

definePageMeta({
    middleware: ["auth"],
})

const data = reactive({
    text: '',
    attachment: {
        names: [] as string[],
        files: [] as File[]
    },
    elevation: URGENCY.D,
    reference: ulid()
})

const createNewTicket = async () => {
    formData.append('info', data.text)
    formData.append('urgency', data.elevation)
    formData.append('creator', useUser().value.user_id)
    formData.append('reference', data.reference)
    is_loading.value = true
    const response = await $fetch<HttpResponseTemplate>('/api/tickets/create', {
        method: 'POST',
        body: formData
    })
    is_loading.value = false
    console.log(response)
    if (response?.statusCode === 200) {
        alert('Ticket Created Successfully')
        await navigateTo('/tickets/view/user')
    } else {
        alert(response?.body || 'An error occurred')
    }
}

const createAttachment = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files) return
    formData.delete('attachment')
    for (const file of target.files) {
        data.attachment.names.push(file.name)
        data.attachment.files.push(file)
        formData.append('attachment', file)
    }
}

const resetForm = () => {
    data.text = ''
    data.attachment.names = []
    data.attachment.files = []
    data.elevation = URGENCY.D
    is_loading.value = false
}
</script>