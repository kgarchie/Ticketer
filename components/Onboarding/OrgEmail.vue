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
  console.log(otp_input_fields.value)
  if (!otp_input_fields.value) return []
  return Array.from(otp_input_fields.value.children) as HTMLInputElement[]
})
function handle_next_input(event: KeyboardEvent) {
  let current = event.target as HTMLInputElement
  var mykey = "0123456789".split("")
  let index = parseInt(current.classList[1].split("__")[2])
  current.value = event.key

  if (event.keyCode == 8 && index > 1) {
    (current.previousElementSibling as HTMLInputElement)?.focus()
  }
  if (index < 6 && mykey.indexOf("" + event.key + "") != -1) {
    var next = current.nextElementSibling as HTMLInputElement;
    next?.focus()
  }
  var _finalKey = ""
  for (let { value } of otp_inputs.value) {
    _finalKey += value
  }

  if (_finalKey.length == 6) {
    code.value = _finalKey
    document.querySelector("#_otp")?.classList.replace("_notok", "_ok")
  } else {
    document.querySelector("#_otp")?.classList.replace("_ok", "_notok")
  }
}
</script>

<template>
  <TransitionGroup name="fade" tag="div">
    <form @submit.prevent="submitEmail" class="is-flex is-flex-direction-column box onboarding" v-if="!showCodeInput">
      <div class="column">
        <label>Work Email</label>
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
    <form @submit.prevent="submitCode" class="otp-form" name="otp-form" v-else>
      <div class="otp-input-fields" ref="otp_input_fields" @keydown="handle_next_input">
        <input type="number" class="otp__digit otp__field__1">
        <input type="number" class="otp__digit otp__field__2">
        <input type="number" class="otp__digit otp__field__3">
        <input type="number" class="otp__digit otp__field__4">
        <input type="number" class="otp__digit otp__field__5">
        <input type="number" class="otp__digit otp_Q_field__6">
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

  small {
    color: #2f8f1f;
  }
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
    border: 1px solid #2f8f1f;
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