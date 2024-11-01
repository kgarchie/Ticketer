<template>
    <form @submit.prevent="submitInvites" class="onboarding box">
        <h1 class="heading">Invite your team</h1>
        <div class="is-relative">
            <div @keydown.enter.prevent="addEmail" contenteditable="true" @keyup.,.prevent="addEmail"
                class="textarea has-placeholder" ref="input" @focusin="hidePlaceholder = true"
                @focusout="showPlaceholder" @input="addText">
                <span class="placeholder" v-if="!hidePlaceholder">
                    Example: allan@{{ emailExt }}, judy@{{ emailExt }}
                </span>
                <br v-if="invites.size > 0">
                <div v-for="invite in invites" class="tag is-primary is-light is-medium invite mt-1" :key="invite.email">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon is-small">
                        <path
                            d="M21.7267 2.95694L16.2734 22.0432C16.1225 22.5716 15.7979 22.5956 15.5563 22.1126L11 13L1.9229 9.36919C1.41322 9.16532 1.41953 8.86022 1.95695 8.68108L21.0432 2.31901C21.5716 2.14285 21.8747 2.43866 21.7267 2.95694ZM19.0353 5.09647L6.81221 9.17085L12.4488 11.4255L15.4895 17.5068L19.0353 5.09647Z">
                        </path>
                    </svg>
                    <p class="mx-0.5">
                        {{ invite.email }}
                    </p>
                    <button type="button" @click="invites.delete(invite)" class="delete is-small"></button>
                </div>
            </div>
            <small class="help has-text-grey">Press <code>Enter</code> or <code>,</code> to add an email</small>
        </div>
        <div class="buttons mt-2">
            <button type="button" @click="copyInviteLink" class="button is-primary is-light is-outlined">
                <span>Copy Invite</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="currentColor"
                    style="width: 18px; margin-right: 2px;">
                    <path
                        d="M13.0607 8.11097L14.4749 9.52518C17.2086 12.2589 17.2086 16.691 14.4749 19.4247L14.1214 19.7782C11.3877 22.5119 6.95555 22.5119 4.22188 19.7782C1.48821 17.0446 1.48821 12.6124 4.22188 9.87874L5.6361 11.293C3.68348 13.2456 3.68348 16.4114 5.6361 18.364C7.58872 20.3166 10.7545 20.3166 12.7072 18.364L13.0607 18.0105C15.0133 16.0578 15.0133 12.892 13.0607 10.9394L11.6465 9.52518L13.0607 8.11097ZM19.7782 14.1214L18.364 12.7072C20.3166 10.7545 20.3166 7.58872 18.364 5.6361C16.4114 3.68348 13.2456 3.68348 11.293 5.6361L10.9394 5.98965C8.98678 7.94227 8.98678 11.1081 10.9394 13.0607L12.3536 14.4749L10.9394 15.8891L9.52518 14.4749C6.79151 11.7413 6.79151 7.30911 9.52518 4.57544L9.87874 4.22188C12.6124 1.48821 17.0446 1.48821 19.7782 4.22188C22.5119 6.95555 22.5119 11.3877 19.7782 14.1214Z">
                    </path>
                </svg>
            </button>
            <button type="submit" @submit="submitInvites" class="button is-primary ml-auto px-5">Next</button>
        </div>
    </form>
</template>
<script lang="ts" setup>
import type { DomainSettings } from '~/types';
const text = ref('')
const input = ref<HTMLDivElement | null>(null)
const loading = ref(false)

const props = defineProps({
    emailExt: {
        default: () => 'gmail.com',
        type: String
    }
})

const hidePlaceholder = ref(false)

const emit = defineEmits<{
    data: [Invite]
}>()

class Invite<T extends { email: string } = any> extends Set<T> {
    has({ email }: T) {
        for (const item of this) {
            if (item.email === email) return true
        }

        return false
    }

    get(value: T | string) {
        const email = typeof value === 'string' ? value : value.email
        for (const item of this) {
            if (item.email === email) return item
        }

        return undefined
    }

    delete(value: T | string): boolean {
        const item = this.get(value);
        if (item) {
            return super.delete(item);
        }

        return false;
    }
}

const invites = ref<Invite>(new Invite())

function submitInvites() {
    emit('data', invites.value)
}

function copyInviteLink() {
    loading.value = true
    $fetch("/api/auth/onboard/invite/link", {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        },
        method: "POST",
        async onResponse({ response }) {
            loading.value = false
            if (!response.ok) return

            const { link } = response._data
            navigator.clipboard.writeText(link)
            navigator.share?.({ title: 'Invite Link', text: link, url: link })
        }
    })
}

function addEmail() {
    const parts = text.value.split(',')
    for (const part of parts) {
        let email = part.trim()
        if (!email) continue
        if (!email.includes('@')) {
            email = `${email}@${props.emailExt}`
        }
        invites.value.add({ email })
    }

    clearText()
}

function clearText() {
    const element = input.value
    if (!element) return console.warn("No input element found")
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes(text.value)) {
            node.remove()
        }
    }
}

function getText() {
    const element = input.value
    if (!element) return ''
    let textAcc = ''
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i]
        if (node.nodeType === Node.TEXT_NODE) {
            textAcc += node.textContent
        }
    }
    return textAcc.trim()
}

function showPlaceholder() {
    hidePlaceholder.value = !!getText() || invites.value.size > 0
}

function addText() {
    text.value = getText()
}
</script>

<style scoped>
.has-placeholder {
    --padding: calc(.75em - 1px);
}

.textarea {
    height: fit-content;
    font-size: 0.9rem;
    padding: var(--padding);
}

.has-placeholder .placeholder {
    position: absolute;
    font-size: 0.9rem;
    color: #A0AEC0;
    pointer-events: none;
    top: 0;
    padding-top: var(--padding);
}

.invite {
    display: flex;
    width: fit-content;
    max-width: 100%;
    justify-content: start;
    align-items: center;
    cursor: pointer;
}

.invite p {
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.invite button {
    margin-top: 2px;
}

.invite p:hover {
    max-width: unset;
    overflow: visible;
    white-space: normal;
}

.invite:has(p:hover) {
    max-width: unset;
    width: fit-content;
}
</style>