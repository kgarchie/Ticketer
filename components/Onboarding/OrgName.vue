<template>
    <form @submit.prevent="submitName" class="is-flex is-flex-direction-column box onboarding">
      <div class="column">
        <label>Organisation Name</label>
        <input class="input is-primary mt-1" type="text" v-model="name"
          required autocomplete="off">
        <small class="has-text-grey">Give your organisation a name</small>
      </div>
      <p class="px-3 mt-2">
        <small>This is a unique identifier to your app instance</small>
      </p>
      <div class="column">
        <button class="button is-primary is-fullwidth" type="submit">Continue</button>
      </div>
    </form>
</template>
<script lang="ts" setup>
const emits = defineEmits<{
  data: [name: string]
}>()
const name = ref('')

const props = defineProps({
    email: String as PropType<string | undefined>
})

if (props.email) {
    name.value = props.email.split('@')[1].split('.')[0]
}

const submitName = () => {
  if (!name.value) return

  $fetch("/api/auth/onboard/name/verify", {
    method: "POST",
    body: {name: name.value},
    onResponse({response}){
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
</script>