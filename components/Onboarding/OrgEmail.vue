<script setup lang="ts">
const notifications = useNotifications()
const emit = defineEmits<{
  data: [email: string]
}>()
const email = ref('')

const showCodeInput = ref(false)
const code = ref('')

function submitEmail() {
  $fetch("/api/auth/onboard/email", {
    method: "POST",
    body: { email: email.value, origin: window.location.origin },
    onResponse({ response }) {
      if (!response.ok) {
        notifications.value.push({
          message: unWrapFetchError(response, "none"),
          opened: false,
          id: 0,
        })
        return
      }

      showCodeInput.value = true
      notifications.value.push({
        message: "Code sent to email: " + email.value,
        opened: false,
        id: 0,
      })
    }
  })
}

function submitCode() {
  if (code.value.length !== 6) return notifications.value.push({
    message: "Invalid code",
    opened: false,
    id: 0,
  })
  $fetch("/api/auth/onboard/email/verify", {
    method: "POST",
    body: { email: email.value, code: code.value },
    onResponse({ response }) {
      if (!response.ok) {
        notifications.value.push({
          message: unWrapFetchError(response, "none"),
          opened: false,
          id: 0,
        })
        return
      }

      emit('data', email.value)
    }
  })
}

const otp_input_fields = ref<HTMLElement | null>(null)
const otp_inputs = computed(() => {
  if (!otp_input_fields.value) return []
  return Array.from(otp_input_fields.value.children) as HTMLInputElement[]
})
const validKeys = "0 1 2 3 4 5 6 7 8 9 Backspace Delete Enter".split(" ")
function handle_next_input(event: KeyboardEvent) {
  if (validKeys.indexOf(event.key) === -1) return

  event.preventDefault()
  event.stopPropagation()
  let current = event.target as HTMLInputElement
  let index = code.value.length

  if (event.key === "Backspace") {
    if (index === 0) return
    if (index < 6) {
      otp_inputs.value[index].value = ""
    } else if (index === 6) {
      otp_inputs.value[index - 1].value = ""
    }
    code.value = code.value.slice(0, -1)
    otp_inputs.value[index - 1].focus()
    return
  } else if (event.key === "Enter") {
    submitCode()
    return
  } else if (event.key === "Delete") {
    return
  }

  current.value = event.key
  if (index > 5) return

  otp_inputs.value[index + 1]?.focus()
  code.value += event.key
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  const clipboardData = event.clipboardData
  if (!clipboardData) return
  const pastedData = clipboardData.getData("text")
  if (pastedData.length !== 6) return
  code.value = pastedData
  for (let i = 0; i < 6; i++) {
    otp_inputs.value[i].value = pastedData[i]
  }
  submitCode()
}
</script>

<template>
  <TransitionGroup name="fade" tag="div">
    <form @submit.prevent="submitEmail" class="is-flex is-flex-direction-column box onboarding" v-if="!showCodeInput">
      <div class="column">
        <label class="heading">Work Email</label>
        <input class="input is-primary mt-1" type="email" placeholder="username@organisation.domain" v-model="email"
          required autocomplete="off">
        <small class="has-text-grey">We'll send you a confirmation email to verify your account</small>
      </div>
      <p class="px-3 mt-2">
        <small>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy
            Policy</a></small>
      </p>
      <div class="column">
        <button class="button is-primary is-fullwidth" type="submit">Continue</button>
      </div>
    </form>
    <form @submit.prevent="submitCode" class="otp-form mt-5" name="otp-form" v-else>
      <div class="otp-input-fields" ref="otp_input_fields" @keydown="handle_next_input" @paste="handlePaste">
        <input type="number" class="otp__digit">
        <input type="number" class="otp__digit">
        <input type="number" class="otp__digit">
        <input type="number" class="otp__digit">
        <input type="number" class="otp__digit">
        <input type="number" class="otp__digit">
      </div>
      <p>
        <small>Didn't receive the code? <a @click="submitEmail">Resend</a></small>
      </p>
      <div class="m-auto otp-buttons">
        <button class="button is-primary is-fullwidth" type="submit">Verify</button>
      </div>
    </form>
  </TransitionGroup>
</template>

<style scoped lang="scss">
.otp-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  max-width: 400px;
  margin: auto;
  background-color: white;
  box-shadow: 0px 0px 8px 0px #02025044;
  border-radius: 8px;
  width: auto;
  text-align: center;
}

.otp-buttons {
  max-width: 400px;
  width: 100%;
}

.otp-buttons button {
  margin-top: 10px;
  width: 100%;
}

.otp-input-fields {
  margin: auto;
  background-color: white;
  max-width: 400px;
  width: auto;
  display: flex;
  justify-content: center;
  gap: 10px;

  input {
    height: 40px;
    width: 40px;
    background-color: transparent;
    border-radius: 4px;
    border: 1px solid #00c4a7;
    text-align: center;
    outline: none;
    font-size: 16px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    &[type=number] {
      -moz-appearance: textfield;
    }

    &:focus {
      border-width: 2px;
      border-color: darken(#2f8f1f, 5%);
      font-size: 20px;
    }
  }
}
</style>