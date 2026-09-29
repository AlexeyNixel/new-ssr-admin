# Deep-link на модалки редактирования

Страницы-списки админки открывают редактирование сущности в модальном окне.
Чтобы открыть такую модалку **сразу при заходе на страницу** (по прямой ссылке,
из письма, при переходе с другого сайта), добавь к URL страницы query-параметр
`editId` с id сущности.

## Как это работает

Два composable:

- **`app/composables/useModalRouteOpener.ts`** — на странице-списке. При
  инициализации страницы читает `route.query.editId`; если параметр есть —
  вызывает `modal.open()` (без пропсов). После закрытия модалки с сохранением —
  зовёт `onClosed` (рефетч списка). URL не изменяет.
- **`app/composables/useModalEntity.ts`** — внутри модалки. Резолвит
  редактируемую сущность:
  - данные пришли пропсом (клик «Редактировать» по строке таблицы) → берём их,
    **без запроса**;
  - пропса нет, но в URL есть `?editId=<id>` → грузим сущность
    `GET /api/<entity>/:id`, пока грузится — в теле модалки спиннер;
  - сущность не найдена → тост «Запись не найдена» + заглушка в модалке.

Особенности:

- `editId` читается **один раз при загрузке/переходе на страницу**. Изменение
  `?editId=` в адресной строке без перезагрузки модалку не откроет.
- URL при работе с модалкой не меняется — параметр остаётся в адресе.
- Форма в модалке наполняется реактивно (`watch(entity, …, { immediate: true })`),
  т.к. при загрузке по id сущность появляется не сразу.

## Ссылки

| Раздел          | URL для открытия модалки редактирования | GET по id                        |
| --------------- | --------------------------------------- | -------------------------------- |
| Отделы          | `/department?editId=<id>`               | `GET /api/departments/:id`       |
| Уведомления     | `/notification?editId=<id>`             | `GET /api/notification/:id`      |
| Точки на карте  | `/map-point?editId=<id>`                | `GET /api/map-point/:id`         |
| Книги           | `/book?editId=<id>`                     | `GET /api/book/:id?include=preview` |
| Сборники книг   | `/collection?editId=<id>`               | `GET /api/book-collection/:id?include=preview` |
| Навигация       | `/navigation?editId=<id>`               | `GET /api/navigation-item/:id`   |
| Клубы           | `/club?editId=<id>`                     | `GET /api/clubs/:id?include=preview` |

Пример: `https://admin.infomania.ru/book?editId=1f0c...` — откроется страница
«Книги» с уже открытой модалкой редактирования этой книги.

## Разделы с отдельной страницей редактирования

Эти разделы редактируются не в модалке, а на полноэкранной странице
(общий каркас — `app/components/EntityForm/*` + `useEntityForm`):

| Раздел   | URL редактирования       | Создание          |
| -------- | ------------------------ | ----------------- |
| Посты    | `/post/admin/<id>`       | `/post/admin`     |
| Страницы | `/page/admin/<slug>`     | `/page/admin`     |
| События  | `/event/admin/<id>`      | `/event/admin`    |
| Слайды   | `/slide/admin/<id>`      | `/slide/admin`    |
| Игры     | `/game/admin/<id>`       | `/game/admin`     |
| Комиксы  | `/comic/admin/<id>`      | `/comic/admin`    |

Старые ссылки `/event?editId=<id>`, `/slide?editId=<id>`, `/game?editId=<id>`,
`/comic?editId=<id>` продолжают работать: список перенаправляет на
`/<раздел>/admin/<id>` (`redirectEditIdToPage` в `useEntityForm.ts`).

## Как подключить к новой сущности

**Страница-список:**

```ts
const modal = overlay.create(ModalsAdminFoo);
const fetchData = async () => { /* ... */ };

useModalRouteOpener({
  modal,
  onClosed: () => fetchData(),
});
```

**Модалка `AdminFoo.vue`:**

```ts
const props = defineProps<{ foo?: Foo }>();
const fooApi = useFooApi();

const { entity: foo, pending, notFound } = useModalEntity({
  prop: props.foo,
  fetchById: (id) => fooApi.getOneFoo(id),   // api.getById<Foo>(API_ENDPOINTS.foo, id)
});
const isUpdate = computed(() => !!foo.value);

const newFoo = ref({ /* дефолты */ });
watch(foo, (value) => {
  if (!value) return;
  newFoo.value = { /* из value */ };
}, { immediate: true });
```

В шаблоне модалки — ветки `v-if="pending"` / `v-else-if="notFound"` / `v-else`
в `#body`.
