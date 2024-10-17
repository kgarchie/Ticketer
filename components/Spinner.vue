<script setup lang="ts">
defineProps({
    loading: {
        type: Boolean,
        default: true
    }
})
</script>
<template>
    <div class="loading-spinner" :class="{ '-paused': !loading }"></div>
</template>
<style scoped>
.loading-spinner {
    animation-play-state: running;
    opacity: 1;
    position: relative;
    transition: opacity linear 0.1s;
    width: 50px;
    height: 50px;
    margin: auto;
}

@keyframes spinner {
    0% {
        transform: translate3d(-50%, -50%, 0) rotate(0deg);
    }

    100% {
        transform: translate3d(-50%, -50%, 0) rotate(360deg);
    }
}

.loading-spinner.-paused {
    animation-play-state: paused;
    opacity: 0.2;
    transition: opacity linear 0.1s;
}

.loading-spinner::before {
    animation: 1.5s linear infinite spinner;
    animation-play-state: inherit;
    border: solid 3px #dedede;
    border-bottom-color: #575757;
    border-radius: 50%;
    content: "";
    left: 50%;
    opacity: inherit;
    position: absolute;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    width: 50px;
    height: 50px;
    will-change: transform;
}
</style>