<template>
  <div class="users" v-if="user.is_admin">
    <div class="user" v-for="item in users"></div>
  </div>
</template>
<script setup>
const users = ref([])
const user = useUser()
</script>