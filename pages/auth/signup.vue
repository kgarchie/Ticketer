<script setup lang="ts">
import type { DomainSettings } from '~/types';

const step = ref(0);
const data = reactive({
  email: '',
  name: '',
  invites: new Set<{ email: string }>(),
  settings: {
    requireApproval: false,
    allowDomain: false,
    emailExtension: undefined,
    allowedDomains: [],
    chat: {
      enabled: true
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

function addInvites<T extends Set<{ email: string }>>(invites: T) {
  step.value++;
  data.invites = invites;

  signup();
}

function signup() {
  loading.value = true;
  const _data = {
    ...data,
    invites: Array.from(data.invites)
  }
  $fetch("/api/auth/onboard/signup", {
    method: "POST",
    body: _data,
    async onResponse({ response }) {
      loading.value = false;
      if (!response.ok) return
      
      await navigateTo("/")
    },
    onResponseError({ response }) {
      useNotifications().value.push({
        id: 0,
        message: unWrapFetchError(response),
        opened: false,
      })
    }
  })
}

const loading = ref(false);

onMounted(() => {
  window.onbeforeunload = () => true
})

onUnmounted(() => {
  window.onbeforeunload = null
})
</script>

<template>
  <Title>Sign Up</Title>
  <TransitionGroup name="slide" tag="div" class="onboarding">
    <OnboardingOrgEmail v-if="step === 0" @data="addEmail" />
    <OnboardingOrgName @data="addName" :email="data.email" :settings="data.settings" v-if="step === 1" />
    <OnboardingOrgInvite @data="addInvites" :settings="data.settings" v-if="step === 2" />
    <Spinner v-if="loading" />
  </TransitionGroup>
</template>

<style>
form.onboarding {
  width: 90%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
}

.slide-enter-active {
  width: 0;
  height: 0;
}

.slide-enter-from {
  opacity: 0;
}

.slide-enter-to {
  transition: opacity 0.3s;
  opacity: 0;
}

.slide-leave-active {
  transition: opacity 0.3s;
  opacity: 0.5;
}

.slide-leave-to {
  transition: transform 0.3s;
  transform: translateY(-100%);
  opacity: 0.5;
}
</style>