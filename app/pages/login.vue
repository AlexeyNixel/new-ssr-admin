<script setup lang="ts">
const auth = useAuth();

const toast = useToast();
const username = ref('');
const password = ref('');
const isShowPassword = ref(false);

const isAuth = ref(true);

const swapPassword = () => {
  isShowPassword.value = !isShowPassword.value;
};

const handleAuth = async () => {
  try {
    const result = await auth.login(username.value, password.value);
    if (result?.access_token) {
      navigateTo('/');
    } else {
      toast.add({
        title: 'Неправильные данные пользователя',
        color: 'error',
      });
      isAuth.value = false;
      return false;
    }
  } catch {
    console.log('error');
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

      <span v-if="!isAuth" class="text-red-600"
        >Неправильный логин или пароль</span
      >

      <UInput v-model="username" class="w-full" placeholder="Логин" />
      <UInput
        v-model="password"
        :type="isShowPassword ? 'text' : 'password'"
        class="w-full"
        placeholder="Пароль"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-mdi-eye-outline"
            aria-label="Clear input"
            @click="swapPassword"
          />
        </template>
      </UInput>
      <UButton class="w-full" @click="handleAuth"> Войти </UButton>
    </div>
  </div>
</template>

<style scoped></style>
