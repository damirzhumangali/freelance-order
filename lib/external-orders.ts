export type ExternalOrder = {
  id: string;
  title: string;
  description: string;
  category: "website" | "app";
  budget: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  contactUrl?: string;
  contactLabel: string;
  contactRestriction: string;
  checkedAt: string;
  countryCode?: string;
  location?: string;
  statusLabel?: string;
  postedAt?: string;
  acceptingUntil?: string;
  kind: "Разработка" | "Дизайн" | "Доработка" | "Публикация" | "Тестирование";
  dateLabel: string;
  clientLabel: string;
  featured: boolean;
};

// A manually checked snapshot of public client requests, not a live feed.
// A public contact confirms a way to ask, never that nobody has replied or that
// the client is still hiring. Do not infer location, budget or remote terms.
const checkedAt = "2026-10-20T07:59:06.000Z";
const contactNote = "Контакт опубликован в открытой подборке Telegram-канала «Удалёнка — вся творческая работа». Для связи нужен аккаунт Telegram; платный доступ биржи не требуется. Уточните у автора, актуальна ли заявка и не выбран ли уже исполнитель. Бюджет и страна не указаны.";

export const externalOrders: ExternalOrder[] = [
  {
    id: "telegram-rueventjob-19159-12",
    title: "Свадебный сайт-приглашение на Tilda",
    description: "Создать стильное свадебное приглашение на Tilda. Это отдельный разовый проект; дизайн и детали реализации заказчик предлагает обсудить напрямую.",
    category: "website",
    budget: "Бюджет не указан",
    tags: ["Tilda", "Свадебный сайт", "Разовый проект"],
    source: "Telegram",
    sourceUrl: "https://t.me/rueventjob/19159",
    contactUrl: "https://t.me/milana_krasnyanskaya",
    contactLabel: "Открыть публикацию",
    contactRestriction: `Пункт 12 в публикации от 19 октября. Написать: @milana_krasnyanskaya. ${contactNote}`,
    checkedAt,
    location: "Страна не указана",
    statusLabel: "Статус уточнить",
    postedAt: "2026-10-19T13:09:50Z",
    kind: "Разработка",
    dateLabel: "19 октября 2026",
    clientLabel: "@milana_krasnyanskaya",
    featured: true,
  },
  {
    id: "telegram-rueventjob-19141-6",
    title: "Новые блоки сайта на Tilda",
    description: "Разработать дизайн новых блоков для существующего сайта на Tilda, сохранив фирменный стиль. В отклике просят портфолио, ориентировочную стоимость и сроки.",
    category: "website",
    budget: "Бюджет не указан",
    tags: ["Tilda", "Веб-дизайн", "Фирменный стиль"],
    source: "Telegram",
    sourceUrl: "https://t.me/rueventjob/19141",
    contactUrl: "https://t.me/sm_et_an_ka",
    contactLabel: "Открыть публикацию",
    contactRestriction: `Пункт 6 в публикации от 17 октября. Написать: @sm_et_an_ka. ${contactNote}`,
    checkedAt,
    location: "Страна не указана",
    statusLabel: "Статус уточнить",
    postedAt: "2026-10-17T14:07:04Z",
    kind: "Дизайн",
    dateLabel: "17 октября 2026",
    clientLabel: "@sm_et_an_ka",
    featured: false,
  },
  {
    id: "telegram-rueventjob-19128-8",
    title: "Обновление дизайна и контента сайта",
    description: "Обновить дизайн и информацию на действующем сайте. Подробности проекта, объём работ, стоимость и сроки нужно согласовать с заказчиком напрямую.",
    category: "website",
    budget: "Бюджет не указан",
    tags: ["Редизайн", "Веб-сайт", "Контент"],
    source: "Telegram",
    sourceUrl: "https://t.me/rueventjob/19128",
    contactUrl: "https://t.me/dmitrii_adminn",
    contactLabel: "Открыть публикацию",
    contactRestriction: `Пункт 8 в публикации от 16 октября. Написать: @dmitrii_adminn. ${contactNote}`,
    checkedAt,
    location: "Страна не указана",
    statusLabel: "Статус уточнить",
    postedAt: "2026-10-16T12:25:11Z",
    kind: "Доработка",
    dateLabel: "16 октября 2026",
    clientLabel: "@dmitrii_adminn",
    featured: false,
  },
  {
    id: "telegram-rueventjob-19128-7",
    title: "UX/UI внутреннего приложения холдинга",
    description: "Предложить 2–3 стилистических направления и дизайн ключевых экранов: задачи, чаты, документы и главная для телефона и компьютера. Нужен опыт CRM и дашбордов; в отклике указать сроки и стоимость.",
    category: "app",
    budget: "Бюджет не указан",
    tags: ["UI / UX", "CRM", "Дашборды"],
    source: "Telegram",
    sourceUrl: "https://t.me/rueventjob/19128",
    contactUrl: "https://t.me/dikarevaaa",
    contactLabel: "Открыть публикацию",
    contactRestriction: `Пункт 7 в публикации от 16 октября. Написать: @dikarevaaa. Заказ на дизайн приложения; возможный прототип обсуждается отдельно. ${contactNote}`,
    checkedAt,
    location: "Страна не указана",
    statusLabel: "Статус уточнить",
    postedAt: "2026-10-16T12:25:11Z",
    kind: "Дизайн",
    dateLabel: "16 октября 2026",
    clientLabel: "@dikarevaaa",
    featured: false,
  },
];

export function getCurrentExternalOrders(now = Date.now()): ExternalOrder[] {
  return externalOrders.filter(order => {
    if (!order.acceptingUntil) return true;
    // Source deadline dates are public, their timezone is not. Stop showing the
    // record at the beginning of that date in Kazakhstan instead of inventing
    // a precise source cutoff or leaving a potentially expired brief visible.
    const cutoff = Date.parse(`${order.acceptingUntil}T00:00:00+05:00`);
    return Number.isFinite(cutoff) && now < cutoff;
  });
}
