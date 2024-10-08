<script setup lang="ts">
import type { DomainSettings } from '~/types';

const step = ref(0);
const data = reactive({
  email: '',
  name: '',
  settings: {
    inviteOnly: false,
    requireApproval: false,
    allowDomain: false,
    allowedDomains: [],
    chat: {
      enabled: false,
      allowGuests: false,
    }
  } as DomainSettings
})

function addEmail(email: string) {
  step.value++;
  data.email = email;
}

function addName(name: string) {
  step.value++;
  data.name = name;
}

function addSettings(settings: DomainSettings) {
  step.value++;
  data.settings = settings;
}
</script>

<template>
<Title>Sign Up</Title>
<TransitionGroup name="slide" tag="div" class="onboarding">
  <!-- <OnboardingOrgEmail v-if="step === 0" @data="addEmail"/>
  <OnboardingOrgName @data="addName" :email="data.email" v-if="step === 1"/> -->
  <OnboardingOrgInvite @data="addSettings"/>
</TransitionGroup>
</template>

<style>
form.onboarding{
    width: 90%;
    max-width: 500px;
    margin: 0 auto;
}
</style>