<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, UBadge, ModalsAdminUser } from '#components';
import { useUserApi } from '~~/services/api/user.api';
import type { AdminUser, User } from '~~/services/types/user.type';

// Раздел только для управляющих пользователями (slip, mgairat) — бэкенд проверяет то же самое
definePageMeta({
  middleware: () => {
    if (!useCookie<User | null>('user_data').value?.canManageUsers) return navigateTo('/');
  },
});

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminUser);
const toast = useToast();
const userApi = useUserApi();
const me = useCookie<User | null>('user_data');

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const search = ref('');

const fetchData = async () => {
  loading.value = true;
  try {
    users.value = await userApi.getAll();
  } catch {
    toast.add({ title: 'Не удалось загрузить пользователей', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();

// Сотрудников немного — фильтруем на клиенте
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return users.value;
  return users.value.filter(
    (user) => user.username.includes(query) || (user.name ?? '').toLowerCase().includes(query)
  );
});
const blockedCount = computed(() => users.value.filter((user) => user.isBlocked).length);

const openModal = async (user?: AdminUser) => {
  if (await modal.open({ user }).result) await fetchData();
};

const setBlocked = async (user: AdminUser, isBlocked: boolean) => {
  try {
    await userApi.update(user.id, { isBlocked });
    user.isBlocked = isBlocked;
    toast.add({
      title: isBlocked ? `${user.username} заблокирован` : `${user.username} разблокирован`,
      description: isBlocked ? 'Вход закрыт, открытые сессии завершатся при следующем запросе' : undefined,
      color: 'success',
    });
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({
      title: 'Не удалось изменить',
      description: typeof message === 'string' ? message : undefined,
      color: 'error',
    });
  }
};

const rowActions = (user: AdminUser) => [
  [
    { label: 'Изменить имя или пароль', icon: 'i-lucide-pencil', onSelect: () => openModal(user) },
    { label: 'Изменения в журнале', icon: 'i-lucide-history', to: `/audit-log?user=${user.id}` },
  ],
  // Себя и администраторов не блокируем — иначе можно остаться без доступа
  ...(user.id === me.value?.id || user.canManageUsers
    ? []
    : [
        [
          user.isBlocked
            ? { label: 'Разблокировать', icon: 'i-lucide-lock-open', onSelect: () => setBlocked(user, false) }
            : {
                label: 'Заблокировать',
                icon: 'i-lucide-lock',
                color: 'error' as const,
                onSelect: () => setBlocked(user, true),
              },
        ],
      ]),
];

const columns: TableColumn<AdminUser>[] = [
  {
    id: 'user',
    header: 'Сотрудник',
    cell: ({ row }) => {
      const user = row.original;
      return h('div', { class: 'min-w-48' }, [
        h('p', { class: 'font-medium text-highlighted' }, [
          user.name || user.username,
          user.id === me.value?.id ? h('span', { class: 'ms-1.5 text-xs font-normal text-muted' }, '(вы)') : null,
        ]),
        h('p', { class: 'font-mono text-xs text-muted' }, user.username),
      ]);
    },
  },
  {
    id: 'role',
    header: 'Роль',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.canManageUsers ? 'Администратор' : 'Редактор',
        color: row.original.canManageUsers ? 'primary' : 'neutral',
        variant: 'subtle',
      }),
  },
  {
    id: 'lastLoginAt',
    header: 'Последний вход',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'whitespace-nowrap text-sm text-muted', title: formatDateTime(row.original.lastLoginAt) },
        row.original.lastLoginAt ? formatRelative(row.original.lastLoginAt) : 'нет данных'
      ),
  },
  {
    id: 'changes',
    header: 'Изменений',
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.changes.toLocaleString('ru-RU')),
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.isBlocked ? 'Заблокирован' : 'Активен',
        color: row.original.isBlocked ? 'error' : 'success',
        variant: 'subtle',
      }),
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'w-12' } },
    cell: ({ row }) => h(ListRowActions, { items: rowActions(row.original) }),
  },
];

const onSelect = (_: Event, row: TableRow<AdminUser>) => openModal(row.original);

useHead({ title: 'НОМБ | Пользователи' });
</script>

<template>
  <NuxtLayout
    v-model:search="search"
    name="table"
    title="Пользователи"
    :description="`${users.length} ${plural(users.length, ['сотрудник', 'сотрудника', 'сотрудников'])}, заблокировано ${blockedCount}`"
    create-label="Добавить сотрудника"
    search-placeholder="Поиск по имени или логину…"
    :loading="loading"
    :event-create="() => openModal()"
  >
    <UTable
      :columns="columns"
      :data="filtered"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty :searching="!!search" icon="i-lucide-users" title="Сотрудников пока нет" @reset="search = ''" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
