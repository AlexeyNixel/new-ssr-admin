<script setup lang="ts">
import { useUserApi } from '~~/services/api/user.api';
import type { AdminUser } from '~~/services/types/user.type';

const props = defineProps<{ user?: AdminUser }>();
const emit = defineEmits<{ close: [boolean] }>();

const MIN_PASSWORD = 8;

const toast = useToast();
const userApi = useUserApi();
const isUpdate = !!props.user;

const form = reactive({
  username: props.user?.username ?? '',
  name: props.user?.name ?? '',
  password: '',
  // Новому сотруднику — ничего, пока не отметят; существующему — как сохранено (null = всё)
  sections: (props.user ? props.user.sections : []) as string[] | null,
});
/** Администраторам доступно всё — разделы им не настраиваются */
const isManager = !!props.user?.canManageUsers;
const saving = ref(false);
const showPassword = ref(false);

const usernameError = computed(() =>
  !isUpdate && form.username && !/^[a-z0-9._-]{3,50}$/.test(form.username.trim().toLowerCase())
    ? 'Латинские буквы, цифры, точка, дефис, подчёркивание; от 3 символов'
    : undefined
);
const passwordError = computed(() =>
  form.password && form.password.length < MIN_PASSWORD ? `Не короче ${MIN_PASSWORD} символов` : undefined
);
const canSubmit = computed(() =>
  isUpdate
    ? !passwordError.value
    : !!form.username.trim() && !usernameError.value && form.password.length >= MIN_PASSWORD
);

/** Пароль без похожих символов — его будут диктовать или переписывать */
const generatePassword = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint32Array(12));
  form.password = Array.from(random, (n) => alphabet[n % alphabet.length]).join('');
  showPassword.value = true;
};

const { copy } = useClipboard({ legacy: true });

const onSubmit = async () => {
  if (!canSubmit.value) return;
  saving.value = true;
  try {
    if (isUpdate && props.user) {
      await userApi.update(props.user.id, {
        name: form.name.trim() || null,
        ...(form.password && { password: form.password }),
        ...(!isManager && { sections: form.sections }),
      });
    } else {
      await userApi.create({
        username: form.username.trim().toLowerCase(),
        name: form.name.trim() || null,
        password: form.password,
        sections: form.sections,
      });
    }
    if (form.password) {
      await copy(form.password);
      toast.add({
        title: isUpdate ? 'Пароль изменён' : 'Сотрудник добавлен',
        description: 'Пароль скопирован — передайте его сотруднику лично',
        color: 'success',
      });
    } else {
      toast.add({ title: 'Сохранено', color: 'success' });
    }
    emit('close', true);
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({
      title: 'Не удалось сохранить',
      description: typeof message === 'string' ? message : undefined,
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <UModal
    :title="isUpdate ? `Сотрудник ${user!.username}` : 'Новый сотрудник'"
    :description="isUpdate ? 'Имя, пароль и доступ к разделам. Логин не меняется' : 'Учётная запись для входа в админку'"
    :dismissible="false"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <form class="space-y-5" autocomplete="off" @submit.prevent="onSubmit">
        <UFormField v-if="!isUpdate" required label="Логин" :error="usernameError">
          <UInput v-model="form.username" placeholder="ivanova" class="w-full" autocomplete="off" />
        </UFormField>

        <UFormField label="Имя" help="Как подписывать в журнале изменений">
          <UInput v-model="form.name" placeholder="Анна Иванова" class="w-full" />
        </UFormField>

        <UFormField
          :required="!isUpdate"
          :label="isUpdate ? 'Новый пароль' : 'Пароль'"
          :help="isUpdate ? 'Оставьте пустым, чтобы не менять' : undefined"
          :error="passwordError"
        >
          <UFieldGroup class="w-full">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full font-mono"
              autocomplete="new-password"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
            <UButton color="neutral" variant="outline" icon="i-lucide-dices" @click="generatePassword">
              Придумать
            </UButton>
          </UFieldGroup>
        </UFormField>

        <UFormField label="Доступ к разделам">
          <UAlert
            v-if="isManager"
            color="primary"
            variant="subtle"
            icon="i-lucide-shield-check"
            description="Администратор — доступ ко всем разделам и к управлению пользователями"
          />
          <AdminUserSections v-else v-model="form.sections" />
        </UFormField>

        <div class="flex justify-end gap-3 border-t border-default pt-4">
          <UButton color="neutral" variant="ghost" @click="emit('close', false)">Отмена</UButton>
          <UButton type="submit" icon="i-lucide-check" :loading="saving" :disabled="!canSubmit">
            {{ isUpdate ? 'Сохранить' : 'Добавить' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
