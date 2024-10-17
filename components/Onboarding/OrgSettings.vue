<template>
    <div>
        <h1>Organization Settings</h1>
        <p>Configure your organization settings</p>
        <form>
            <div v-if="settings.allowDomain">
                <label for="allowedDomains">Allowed Domains</label>
                <input type="text" id="allowedDomains" v-model="settings.allowedDomains"/>
            </div>
            <div>
                <label for="chatEnabled">Chat Enabled</label>
                <input type="checkbox" id="chatEnabled" v-model="settings.chat?.enabled"/>
            </div>
            <button type="submit" @submit="submitSettings">Next</button>
        </form>
    </div>
</template>
<script lang="ts" setup>
import type { DomainSettings } from '~/types';

const props = defineProps({
    settings: {
        required: true,
        type: Object as PropType<DomainSettings>
    }
})

if(!props.settings.chat) {
    props.settings.chat = {
        enabled: true
    }
}

const emit = defineEmits<{
    data: [DomainSettings]
}>()

function submitSettings() {
    emit('data', props.settings)
}
</script>