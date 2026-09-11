<script setup lang="ts">
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import AdminNavigation from '~/components/Modals/AdminNavigation.vue';
import NavTree from '~/components/Navigation/NavTree.vue';

const overlay = useOverlay();
const modal = overlay.create(AdminNavigation);

const { tree, saving, reload, applyMove } = useNavTree();
await reload();

const navTreeRef = useTemplateRef<InstanceType<typeof NavTree>>('navTree');

const openModal = async (navigationItem?: NavigationItem) => {
  const instance = modal.open(navigationItem ? { navigationItem } : {});
  const result = await instance.result;
  if (result) await reload();
};

const openCreateChild = async (parentId: string) => {
  const instance = modal.open({ parentId });
  const result = await instance.result;
  if (result) await reload();
};

useModalRouteOpener({ modal, onClosed: () => reload() });

useHead({ title: 'НОМБ | Навигация' });
</script>

<template>
  <NuxtLayout
    name="table"
    title="Управление навигацией"
    :event-create="() => openModal()"
  >
    <div class="p-4 sm:p-6 space-y-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          <span
            v-if="saving"
            class="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            Сохранение…
          </span>
          <span v-else class="inline-flex items-center gap-1.5">
            <UIcon
              name="i-heroicons-check-circle"
              class="w-4 h-4 text-green-500"
            />
            Порядок и вложенность сохраняются автоматически при перетаскивании
          </span>
        </p>

        <div class="flex items-center gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-chevrons-up-down"
            label="Развернуть всё"
            @click="navTreeRef?.expandAll()"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-chevrons-down-up"
            label="Свернуть всё"
            @click="navTreeRef?.collapseAll()"
          />
        </div>
      </div>

      <NavTree
        ref="navTree"
        :nodes="tree"
        @move="applyMove"
        @edit="openModal"
        @create-child="openCreateChild"
      />
    </div>
  </NuxtLayout>
</template>
