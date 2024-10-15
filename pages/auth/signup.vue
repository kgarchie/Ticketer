<script setup lang="ts">
import type { DomainSettings } from '~/types';

const step = ref(0);
const data = reactive({
  email: '',
  name: '',
  invites: new Set<{email: string}>(),
  settings: {
    requireApproval: false,
    allowDomain: false,
    emailExtension: undefined,
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

function addInvites<T extends Set<{email: string}>>(invites: T) {
  step.value++;
  data.invites = invites;
}
</script>

<template>
<Title>Sign Up</Title>
<TransitionGroup name="slide" tag="div" class="onboarding">
  <OnboardingOrgEmail v-if="step === 0" @data="addEmail" />
  <OnboardingOrgName @data="addName" :email="data.email" :settings="data.settings" v-if="step === 1"/>
  <OnboardingOrgInvite @data="addInvites" :settings="data.settings" v-if="step === 2"/>
</TransitionGroup>
</template>

<style>
form.onboarding{
    width: 90%;
    max-width: 500px;
    margin: 0 auto;
}
</style>