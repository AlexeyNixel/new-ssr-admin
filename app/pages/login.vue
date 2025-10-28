<script setup lang="ts">
const auth = useAuth();

const username = ref('');
const password = ref('');

const handleAuth = async () => {
  const res = await auth.login(username.value, password.value);
  console.log(res);
};
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <div
      class="flex flex-col items-center justify-center w-[300px] h-max bg-white"
    >
      <h1>Авторизация</h1>
      <UInput v-model="username" placeholder="Логин" />
      <UInput v-model="password" placeholder="Пароль" />
      <UButton @click="handleAuth"> Войти </UButton>
    </div>
  </div>
</template>

<style scoped></style>
