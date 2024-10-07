<script setup lang="ts">
const step = ref(0);
const data = reactive({
  email: '',
  name: '',
  settings: {
    inviteOnly: false,
    requireApproval: false,
    allowDomain: false,
  }
})

function addEmail(email: string) {
  step.value++;
  data.email = email;
}

function addName(name: string) {
  step.value++;
  data.name = name;
}

function addSettings(settings: { inviteOnly: boolean, requireApproval: boolean, allowDomain: boolean }) {
  step.value++;
  data.settings = settings;
}
</script>

<template>
<Title>Sign Up</Title>
<TransitionGroup name="slide" tag="div" class="onboarding">
  <OnboardingOrgEmail v-if="step === 0" @data="addEmail"/>
  <OnboardingOrgName v-if="step === 1"/>
</TransitionGroup>
</template>

<style>
form.onboarding{
    width: 90%;
    max-width: 500px;
    margin: 0 auto;
}
</style>