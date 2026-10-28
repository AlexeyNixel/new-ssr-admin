<script setup lang="ts">
import { useMediaApi } from '~~/services/api/media.api';
import type { MediaFile, MediaUsage } from '~~/services/types/media.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 36;

const toast = useToast();
const mediaApi = useMediaApi();
const { copy } = useClipboard({ legacy: true });

const { page, search, filters } = useListQuery({ type: 'all', usage: 'all' });

const files = ref<MediaFile[]>([]);
const meta = ref<Meta>();
const totalSize = ref(0);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await mediaApi.getAll({
      page: page.value,
      limit: PAGE_SIZE,
      search: search.value || undefined,
      ...(filters.type !== 'all' && { type: filters.type as MediaFile['type'] }),
      ...(filters.usage === 'unused' && { unused: true }),
    });
    files.value = res.data ?? [];
    meta.value = res.meta;
    totalSize.value = res.totalSize;
  } catch {
    toast.add({ title: 'Не удалось загрузить файлы', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();
watch([page, search, () => ({ ...filters })], fetchData);

// ---------- Выбранный файл: где используется ----------

const selected = ref<MediaFile | null>(null);
const usage = ref<MediaUsage[] | null>(null);
const deleting = ref(false);
const confirmDelete = ref(false);

const select = async (file: MediaFile) => {
  selected.value = file;
  usage.value = null;
  confirmDelete.value = false;
  try {
    const result = await mediaApi.usage(file.id);
    if (selected.value?.id === file.id) usage.value = result;
  } catch {
    if (selected.value?.id === file.id) usage.value = [];
    toast.add({ title: 'Не удалось проверить, где используется файл', color: 'error' });
  }
};

const remove = async () => {
  if (!selected.value) return;
  deleting.value = true;
  try {
    await mediaApi.remove(selected.value.id);
    toast.add({ title: 'Файл удалён', color: 'success' });
    selected.value = null;
    await fetchData();
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({ title: 'Не удалось удалить', description: message, color: 'error' });
  } finally {
    deleting.value = false;
  }
};

const copyUrl = async (file: MediaFile) => {
  await copy(staticUrl(file.path));
  toast.add({ title: 'Адрес скопирован', color: 'success' });
};

const isImage = (file: MediaFile) => file.type === 'IMAGE' || file.mimeType.startsWith('image/');
const thumb = (file: MediaFile) => staticUrl(file.variants?.['400'] ?? file.path);

const FILE_ICONS: Record<string, string> = {
  DOCUMENT: 'i-lucide-file-text',
  VIDEO: 'i-lucide-file-video',
  AUDIO: 'i-lucide-file-audio',
  ARCHIVE: 'i-lucide-file-archive',
};

const typeItems = [
  { label: 'Все типы', value: 'all' },
  { label: 'Картинки', value: 'IMAGE' },
  { label: 'Документы', value: 'DOCUMENT' },
];
const usageItems = [
  { label: 'Все', value: 'all' },
  { label: 'Не привязаны к записям', value: 'unused' },
];

const resetFilters = () => {
  search.value = '';
  filters.type = 'all';
  filters.usage = 'all';
};

useHead({ title: 'НОМБ | Медиатека' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Медиатека"
    :description="`Загруженные картинки и документы · ${formatFileSize(totalSize)}`"
    search-placeholder="Поиск по имени файла…"
    :meta="meta"
    :loading="loading"
  >
    <template #filters>
      <USelect v-model="filters.type" :items="typeItems" class="w-40" aria-label="Тип файла" />
      <UTabs v-model="filters.usage" :items="usageItems" :content="false" size="sm" />
    </template>

    <div class="p-4 sm:p-5">
      <UAlert
        v-if="filters.usage === 'unused'"
        class="mb-4"
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        description="Здесь файлы без превью-связей. Картинка всё ещё может стоять в тексте новости — перед удалением мы это проверим."
      />

      <div v-if="loading && !files.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <USkeleton v-for="i in 12" :key="i" class="aspect-square w-full rounded-lg" />
      </div>

      <ListEmpty
        v-else-if="!files.length"
        :searching="!!search || filters.type !== 'all' || filters.usage !== 'all'"
        icon="i-lucide-images"
        title="Файлов пока нет"
        @reset="resetFilters"
      />

      <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <li v-for="file in files" :key="file.id">
          <button
            type="button"
            class="group w-full cursor-pointer overflow-hidden rounded-lg bg-default text-left ring-1 ring-default transition hover:ring-primary/60 focus-visible:outline-2 focus-visible:outline-primary"
            @click="select(file)"
          >
            <div class="relative flex aspect-square items-center justify-center bg-elevated">
              <img v-if="isImage(file)" :src="thumb(file)" alt="" loading="lazy" class="size-full object-cover">
              <UIcon v-else :name="FILE_ICONS[file.type] ?? 'i-lucide-file'" class="size-10 text-muted" />
              <UBadge
                v-if="!file.usedIn"
                label="не привязан"
                color="warning"
                variant="solid"
                size="sm"
                class="absolute start-1.5 top-1.5"
              />
            </div>
            <div class="px-2 py-1.5">
              <p class="truncate text-xs font-medium text-highlighted" :title="file.originalName">{{ file.originalName }}</p>
              <p class="text-xs text-dimmed tabular-nums">{{ formatFileSize(file.size) }}</p>
            </div>
          </button>
        </li>
      </ul>
    </div>

    <USlideover
    :open="!!selected"
    :title="selected?.originalName"
    :description="selected ? `${formatFileSize(selected.size)} · загружен ${formatDate(selected.createdAt)}` : undefined"
    @update:open="(open) => !open && (selected = null)"
  >
    <template #body>
      <div v-if="selected" class="space-y-5">
        <a :href="staticUrl(selected.path)" target="_blank" rel="noopener" class="block">
          <img
            v-if="isImage(selected)"
            :src="staticUrl(selected.path)"
            alt=""
            class="max-h-80 w-full rounded-lg bg-elevated object-contain ring-1 ring-default"
          >
          <div v-else class="flex h-32 items-center justify-center rounded-lg bg-elevated">
            <UIcon :name="FILE_ICONS[selected.type] ?? 'i-lucide-file'" class="size-12 text-muted" />
          </div>
        </a>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted">Тип</dt>
          <dd>{{ selected.mimeType }}</dd>
          <template v-if="selected.width">
            <dt class="text-muted">Размер</dt>
            <dd class="tabular-nums">{{ selected.width }} × {{ selected.height }}</dd>
          </template>
          <dt class="text-muted">Адрес</dt>
          <dd class="break-all font-mono text-xs">{{ selected.path }}</dd>
        </dl>

        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-copy" color="neutral" variant="outline" size="sm" @click="copyUrl(selected)">
            Скопировать адрес
          </UButton>
          <UButton
            :to="staticUrl(selected.path)"
            target="_blank"
            icon="i-lucide-external-link"
            color="neutral"
            variant="outline"
            size="sm"
          >
            Открыть
          </UButton>
        </div>

        <section>
          <h3 class="mb-2! text-sm! font-semibold! text-highlighted">Где используется</h3>
          <div v-if="usage === null" class="space-y-2">
            <USkeleton v-for="i in 2" :key="i" class="h-8 w-full" />
          </div>
          <p v-else-if="!usage.length" class="text-sm text-muted">Нигде — ни в записях, ни в текстах.</p>
          <ul v-else class="space-y-1">
            <li v-for="item in usage" :key="`${item.type}:${item.id}:${item.via}`" class="text-sm">
              <span class="text-xs text-muted">
                {{ auditEntityLabel(item.type) }}{{ item.via === 'text' ? ', в тексте' : '' }}:
              </span>
              <ULink
                v-if="auditEntityLink(item.type, item.id)"
                :to="auditEntityLink(item.type, item.id)!"
                class="ms-1 text-primary hover:underline"
              >
                {{ item.title }}
              </ULink>
              <span v-else class="ms-1">{{ item.title }}</span>
            </li>
          </ul>
        </section>

        <section v-if="usage && !usage.length" class="border-t border-default pt-4">
          <p v-if="!selected.canDelete" class="text-sm text-muted">
            <UIcon name="i-lucide-lock" class="me-1 align-middle" />
            Файл со старого сайта — удалить нельзя, хранилище только для чтения.
          </p>
          <template v-else-if="!confirmDelete">
            <UButton icon="i-lucide-trash-2" color="error" variant="soft" @click="confirmDelete = true">
              Удалить файл
            </UButton>
          </template>
          <div v-else class="space-y-2">
            <p class="text-sm">Файл и его уменьшенные копии удалятся из хранилища навсегда.</p>
            <div class="flex gap-2">
              <UButton icon="i-lucide-trash-2" color="error" :loading="deleting" @click="remove">Удалить навсегда</UButton>
              <UButton color="neutral" variant="ghost" @click="confirmDelete = false">Отмена</UButton>
            </div>
          </div>
        </section>
      </div>
    </template>
    </USlideover>
  </NuxtLayout>
</template>
