<script setup lang="ts">
const step = ref(0);
</script>

<template>
<Title>Sign Up</Title>
<TransitionGroup>
  <OnboardingOrgEmail v-if="step === 0" />
</TransitionGroup>
</template>

<style>
form.onboarding{
    width: 90%;
    max-width: 500px;
    margin: 0 auto;
}
</style>