<script setup lang="ts">
import QRCode from 'qrcode';
import { useShortLinkApi } from '~~/services/api/short-link.api';
import type { IShortLink, ShortLinkDayStat } from '~~/services/types/short-link.type';

const props = defineProps<{ shortLink: IShortLink }>();
defineEmits<{ close: [boolean] }>();

const toast = useToast();
const shortLinkApi = useShortLinkApi();
const linkUrl = useShortLinkUrl();
const fullUrl = linkUrl.full(props.shortLink.slug);

// ---------- QR-код ----------

/** Крупный PNG для печати на афишах; SVG — для типографии (масштабируется без потерь) */
const QR_OPTIONS = { errorCorrectionLevel: 'M' as const, margin: 2, color: { dark: '#000000', light: '#ffffff' } };
const qrPreview = ref('');

onMounted(async () => {
  qrPreview.value = await QRCode.toDataURL(fullUrl, { ...QR_OPTIONS, width: 320 });
});

const download = (href: string, extension: string) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = `qr-${props.shortLink.slug}.${extension}`;
  link.click();
};

const downloadPng = async () => {
  download(await QRCode.toDataURL(fullUrl, { ...QR_OPTIONS, width: 2048 }), 'png');
};

const downloadSvg = async () => {
  const svg = await QRCode.toString(fullUrl, { ...QR_OPTIONS, type: 'svg' });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  download(url, 'svg');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------- Переходы по дням ----------

const PERIODS = [
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 },
  { label: 'Год', value: 365 },
];
const days = ref(30);
const stats = ref<ShortLinkDayStat[] | null>(null);

const loadStats = async () => {
  stats.value = null;
  try {
    stats.value = await shortLinkApi.getStats(props.shortLink.id, days.value);
  } catch {
    stats.value = [];
    toast.add({ title: 'Не удалось загрузить статистику', color: 'error' });
  }
};
watch(days, loadStats, { immediate: true });

const periodTotal = computed(() => (stats.value ?? []).reduce((sum, day) => sum + day.clicks, 0));
const maxClicks = computed(() => Math.max(1, ...(stats.value ?? []).map((day) => day.clicks)));
const busiest = computed(() =>
  (stats.value ?? []).reduce<ShortLinkDayStat | null>((best, day) => (day.clicks > (best?.clicks ?? 0) ? day : best), null)
);

const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const formatDay = (day: string) => dayFormat.format(new Date(`${day}T12:00:00`));

const hovered = ref<ShortLinkDayStat | null>(null);
const showTable = ref(false);
</script>

<template>
  <UModal :title="shortLink.title || linkUrl.display(shortLink.slug)" :description="linkUrl.display(shortLink.slug)">
    <template #body>
      <div class="space-y-6">
        <!-- Переходы -->
        <section class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-3xl font-semibold tabular-nums text-highlighted">
                {{ periodTotal.toLocaleString('ru-RU') }}
              </p>
              <p class="text-xs text-muted">
                {{ plural(periodTotal, ['переход', 'перехода', 'переходов']) }} за период · всего
                {{ shortLink.clicks.toLocaleString('ru-RU') }}
              </p>
            </div>
            <UTabs v-model="days" :items="PERIODS" :content="false" size="xs" />
          </div>

          <USkeleton v-if="stats === null" class="h-36 w-full" />

          <template v-else>
            <!-- Подсказка при наведении: одна строка над графиком, не перекрывает столбики -->
            <p class="h-5 text-sm tabular-nums text-muted" aria-live="polite">
              <template v-if="hovered">
                <span class="text-highlighted">{{ formatDay(hovered.day) }}</span> —
                {{ hovered.clicks }} {{ plural(hovered.clicks, ['переход', 'перехода', 'переходов']) }}
              </template>
              <template v-else-if="busiest">
                Больше всего — {{ formatDay(busiest.day) }}: {{ busiest.clicks }}
              </template>
              <template v-else>Переходов за период не было</template>
            </p>

            <div
              class="flex h-32 items-end border-b border-default"
              :class="stats.length > 90 ? 'gap-0' : 'gap-0.5'"
              role="img"
              :aria-label="`Переходы по дням: всего ${periodTotal}`"
              @mouseleave="hovered = null"
            >
              <!-- Колонка на всю высоту — большая зона наведения, столбик внутри -->
              <div
                v-for="day in stats"
                :key="day.day"
                class="flex h-full min-w-0 flex-1 cursor-default items-end"
                @mouseenter="hovered = day"
              >
                <div
                  class="w-full rounded-t-[4px] transition-colors"
                  :class="hovered?.day === day.day ? 'bg-primary' : 'bg-primary/70'"
                  :style="{ height: day.clicks ? `${Math.max(3, (day.clicks / maxClicks) * 100)}%` : '0' }"
                />
              </div>
            </div>
            <div class="flex justify-between text-xs text-dimmed tabular-nums">
              <span>{{ formatDay(stats[0]!.day) }}</span>
              <span>сегодня</span>
            </div>

            <UButton variant="link" size="xs" class="px-0" @click="showTable = !showTable">
              {{ showTable ? 'Скрыть таблицу' : 'Показать таблицей' }}
            </UButton>
            <div v-if="showTable" class="max-h-48 overflow-y-auto rounded-lg ring-1 ring-default">
              <table class="w-full text-sm">
                <tbody>
                  <tr
                    v-for="day in [...stats].reverse().filter((d) => d.clicks)"
                    :key="day.day"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-3 py-1 text-muted">{{ formatDay(day.day) }}</td>
                    <td class="px-3 py-1 text-end tabular-nums">{{ day.clicks }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs text-dimmed">
              Переходы по дням считаются с момента появления этой статистики — более ранние вошли только в
              общий счётчик.
            </p>
          </template>
        </section>

        <!-- QR-код -->
        <section class="flex flex-col items-center gap-4 border-t border-default pt-5 sm:flex-row sm:items-start">
          <img
            v-if="qrPreview"
            :src="qrPreview"
            :alt="`QR-код для ${linkUrl.display(shortLink.slug)}`"
            class="size-40 shrink-0 rounded-lg ring-1 ring-default"
          >
          <USkeleton v-else class="size-40 shrink-0" />
          <div class="space-y-3">
            <div>
              <p class="font-medium text-highlighted">QR-код для афиш</p>
              <p class="text-sm text-muted">
                Ведёт на короткую ссылку — переходы по нему тоже считаются. Если поменять, куда ведёт ссылка,
                напечатанный код продолжит работать.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton icon="i-lucide-download" size="sm" @click="downloadPng">PNG для печати</UButton>
              <UButton icon="i-lucide-download" size="sm" color="neutral" variant="outline" @click="downloadSvg">
                SVG
              </UButton>
            </div>
          </div>
        </section>
      </div>
    </template>
  </UModal>
</template>
