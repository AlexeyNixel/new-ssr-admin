import { findPlacement } from '~~/services/ai/postTags';
import { tagDocument } from '~~/services/ai/tagHints';

/**
 * Тематические теги по убыванию соответствия новости — через эмбеддинги (bge-m3).
 *
 * Как считается соответствие тега:
 *  1. Тег представлен описанием из services/ai/tagHints.ts (или названием).
 *  2. Сходство = максимум косинуса между тегом и новостью целиком / каждым её предложением.
 *     По предложениям — чтобы тема из одной фразы («стихи о войне») не тонула в общем тексте.
 *  3. Из сходства вычитается «фон» тега — его сходство с нейтральным библиотечным текстом.
 *     Иначе теги со словами «библиотека», «читальный» похожи на любую новость.
 *  4. Остаются теги с запасом над фоном не меньше MIN_MARGIN.
 * Порог подобран на реальных тегах сайта (2026-10-28): у подходящих запас 0,09–0,34,
 * у шума — до 0,07.
 *
 * Тело: { text, tags: {id,title}[] }   Ответ: { tags: string[] } — id, самый подходящий первым.
 */

const MIN_MARGIN = 0.07;
const MAX_TAGS = 5;
const MAX_SENTENCES = 40;

// Нейтральные фразы без темы — по ним меряется «фон» каждого тега
const NEUTRAL = [
  'В библиотеке прошло мероприятие для читателей.',
  'Приглашаем всех желающих, вход свободный.',
  'Подробности можно узнать по телефону организаторов.',
  'Встреча пройдёт в читальном зале библиотеки.',
  'Новости Молодёжной библиотеки.',
];

// Векторы описаний тегов и фона меняются редко — держим их в памяти сервера
const vectorCache = new Map<string, number[]>();

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25)
    .slice(0, MAX_SENTENCES);

export default defineEventHandler(async (event) => {
  const { text, tags } = await readTagRequest(event);

  // Теги размещения подбираются отдельно (placement.post.ts)
  const thematic = tags.filter((t) => !findPlacement(t));
  if (!thematic.length) return { tags: [] };

  const docs = thematic.map((t) => tagDocument(t.title));
  const chunks = [text, ...sentences(text)];

  // Один запрос к эмбеддеру: недостающие из кэша + куски новости
  const missing = [...new Set([...docs, ...NEUTRAL])].filter((d) => !vectorCache.has(d));
  const vectors = await ollamaEmbed([...missing, ...chunks]);
  missing.forEach((d, i) => vectorCache.set(d, vectors[i]!));
  const chunkVectors = vectors.slice(missing.length);
  const neutralVectors = NEUTRAL.map((d) => vectorCache.get(d)!);

  const scored = thematic.map((tag, i) => {
    const tagVector = vectorCache.get(docs[i]!)!;
    const similarity = Math.max(...chunkVectors.map((v) => cosine(v, tagVector)));
    const background = neutralVectors.reduce((sum, v) => sum + cosine(v, tagVector), 0) / neutralVectors.length;
    return { id: tag.id, score: similarity - background };
  });

  return {
    tags: scored
      .filter((t) => t.score >= MIN_MARGIN)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_TAGS)
      .map((t) => t.id),
  };
});
