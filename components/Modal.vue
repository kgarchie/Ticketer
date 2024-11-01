<template>
    <div class="modal" :class="{ 'is-active': open }">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">
                    <slot name="title">Title</slot>
                </p>
                <button class="delete" aria-label="close" @click="emits('cancel')"></button>
            </header>
            <section class="modal-card-body">
                <slot></slot>
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button class="button is-success" type="button" @click="emits('confirm')">
                        <slot name="confirm">Confirm</slot>
                    </button>
                    <button class="button" type="button" @click="emits('cancel')">
                        <slot name="cancel">Cancel</slot>
                    </button>
                </div>
            </footer>
        </div>
    </div>
</template>
<script setup lang="ts">
defineProps({
    open: {
        type: Boolean,
        default: false
    }
})
const emits = defineEmits<{
    confirm: []
    cancel: []
}>()
</script>