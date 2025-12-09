<script setup lang="ts">
const auth = useAuth();

const username = ref('');
const password = ref('');

const isAuth = ref(true);

const handleAuth = async () => {
  try {
    await auth.login(username.value, password.value);
    navigateTo('/');
  } catch {
    isAuth.value = false;
    return false;
  }
};
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <div
      class="flex flex-col items-center justify-center w-[400px] h-max bg-white rounded p-4 gap-4 shadow"
      @keydown.enter="handleAuth"
    >
      <h3>Авторизация</h3>

      <span v-if="!isAuth">Неправильный логин или пароль</span>

      <UInput v-model="username" class="w-full" placeholder="Логин" />
      <UInput
        v-model="password"
        type="password"
        class="w-full"
        placeholder="Пароль"
      />
      <UButton class="w-full" @click="handleAuth"> Войти </UButton>
    </div>
  </div>
</template>

<style scoped></style>
