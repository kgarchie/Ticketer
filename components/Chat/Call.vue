<template>
  <div class="call box is-flex" v-if="onCall">
    <div class="caller" v-if="caller !== ''"><a href="">{{ caller }}</a> - {{ number }}</div>
    <div class="caller" v-else>Calling</div>
    <div class="call-actions is-flex">
      <button class="button is-small is-primary" @click="acceptCall"><i class="fa fa-phone"></i></button>
      <button class="button is-small is-danger" @click="rejectCall"><i class="fa fa-phone-slash"></i></button>
    </div>
  </div>
</template>
<script setup>
const callState = useCall().value
const user = useUser().value
const sdp = ref('')

const onCall = ref(false)

const caller_user_id = ref('')
const caller = ref('')
const number = ref('')
</script>
<style lang="scss" scoped>
.call {
  position: absolute;
  background: #0F1D38;
  width: 50%;
  min-height: fit-content;
  right: 0;
  outline: 2px solid #5b86e5;
  justify-content: space-between;
  color: white;
  z-index: 10;

  .caller {
    a {
      font-weight: bold;
    }
  }

  .call-actions {
    width: 25%;
    justify-content: space-between;
    gap: 5px;

    button {
      width: 100%;

      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>