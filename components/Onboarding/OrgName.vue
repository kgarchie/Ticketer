<template>
  <form @submit.prevent="submitName" class="is-flex is-flex-direction-column box onboarding">
    <div class="column">
      <label class="heading">Organisation Name</label>
      <input class="input is-primary mt-1" type="text" v-model="name" required autocomplete="off">
      <small class="has-text-grey">Give your organisation a name</small>
    </div>
    <div class="column is-flex is-flex-direction-row-reverse is-justify-content-flex-end py-1" @change="showValidationModal"
      style="font-size: 0.95rem;">
      <label for="allowDomain" class="ml-2 is-small has-text-grey checkbox">Let anyone with your <code>{{ emailExt }}</code> email
        extenstion join</label>
      <input type="checkbox" id="allowDomain" class="switch has-text-grey" v-model="settings.allowDomain" :checked="settings.allowDomain"
        style="margin-left: 1px; width: 12px;" />
    </div>
    <Modal @cancel="cancelValidation" @confirm="confirmValidation" :open="showValidationModalRef">
      <template #title>Validation</template>
      <div class="content">
        <p>Do you want to validate each user on joining the domain?</p>
        <small class="has-text-grey"><code>Yes</code> will allow valid users to join automatically</small>
        <br>
        <small class="has-text-grey"><code>No</code> will requre you to approve each user to join your domain</small>
      </div>
      <template #cancel>
        No
      </template>
      <template #confirm>
        Yes
      </template>
    </Modal>
    <div class="column">
      <button class="button is-primary is-fullwidth" :class="{'is-loading': loading}"
       type="submit">Continue</button>
    </div>
  </form>
</template>
<script lang="ts" setup>
import type { DomainSettings } from '~/types';

const emits = defineEmits<{
  data: [name: string]
}>()
const name = ref('')
const loading = ref(false)


const props = defineProps({
  email: {
    required: true,
    type: String
  },
  settings: {
    required: true,
    type: Object as PropType<DomainSettings>
  }
})

if (props.email) {
  name.value = props.email.split('@')[1].split('.')[0]
}

const emailExt = computed(() => {
  if (!props.email) return ''
  const arr = props.email.split('@')
  if (arr.length < 2) return ''
  return arr[1]
})

const submitName = () => {
  if (!name.value) return
  loading.value = true
  $fetch("/api/auth/onboard/name/verify", {
    method: "POST",
    body: { name: name.value },
    onResponse({ response }) {
      loading.value = false
      if (!response.ok) {
        useNotifications().value.push({
          id: 0,
          message: unWrapFetchError(response),
          opened: false,
        })
        return
      }

      emits('data', name.value)
    }
  })
}

const showValidationModalRef = ref(false)
function showValidationModal(){
  if(props.settings.allowDomain){
    props.settings.emailExtension = emailExt.value
    showValidationModalRef.value = true
  } else {
    props.settings.emailExtension = undefined
    showValidationModalRef.value = false
  }
}

function confirmValidation(){
  showValidationModalRef.value = false
  props.settings.requireApproval = true
}

function cancelValidation(){
  showValidationModalRef.value = false
  props.settings.requireApproval = false
}
</script>