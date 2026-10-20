export type ExternalOrder = {
  id: string;
  title: string;
  description: string;
  category: "website" | "app";
  budget: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  contactLabel: string;
  contactRestriction: string;
  checkedAt: string;
  kind: "Разработка" | "Дизайн";
  dateLabel: string;
  clientLabel: string;
  featured: boolean;
};

// A manually verified snapshot, not a live feed. Keep the verification date
// visible and recheck each source before presenting a listing as still open.
// Budgets below belong to the project brief, never to freelancer proposals.
const checkedAt = "2026-10-20T05:37:31.000Z";

export const externalOrders: ExternalOrder[] = [
  {
    id: "freelance-ru-13066",
    title: "Корпоративный сайт на Битрикс",
    description:
      "Компании нужен адаптивный сайт: 8–10 уникальных страниц, каталог продукции и формы заявок. Дизайн предстоит разработать по референсам заказчика.",
    category: "website",
    budget: "По договорённости",
    tags: ["Битрикс", "Каталог", "Адаптивная версия"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13066",
    contactLabel: "Открыть заказ",
    contactRestriction:
      "Отклик через Freelance.ru. Площадка требует Premium и вход в аккаунт; прямые контакты публично не указаны.",
    checkedAt,
    kind: "Разработка",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: true,
  },
  {
    id: "freelancehunt-1659312",
    title: "Разработка приложений для iOS и Android",
    description:
      "Создание и развитие мобильных приложений: интерфейс, подключение API и авторизации, исправление ошибок, тестирование и поддержка релизов.",
    category: "app",
    budget: "10 100 UAH",
    tags: ["iOS / Android", "Flutter", "React Native", "API"],
    source: "Freelancehunt",
    sourceUrl:
      "https://freelancehunt.com/project/trebuetsya-razrabotchik-mobilnyih-prilozheniy-dlya-razrabotki/1659312.html",
    contactLabel: "Связаться на площадке",
    contactRestriction:
      "Отклик через аккаунт Freelancehunt. На момент проверки приём ставок указан до 30 октября; прямые контакты публично не указаны. Бюджет показан площадкой в UAH.",
    checkedAt,
    kind: "Разработка",
    dateLabel: "16 октября 2026",
    clientLabel: "Petru Ionel Strat",
    featured: false,
  },
  {
    id: "freelance-ru-13055",
    title: "Сайт для бренда косметики",
    description:
      "Небольшой бренд косметики ищет специалиста для создания сайта на Tilda. Указанный заказчиком срок — 10 дней, стоимость обсуждается.",
    category: "website",
    budget: "По договорённости",
    tags: ["Tilda", "Косметика", "10 дней"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13055",
    contactLabel: "Открыть заказ",
    contactRestriction:
      "Отклик через Freelance.ru. Площадка требует Premium и вход в аккаунт; прямые контакты публично не указаны.",
    checkedAt,
    kind: "Разработка",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelancehunt-1658608",
    title: "AI-функция для Android-приложения Task Bloom",
    description:
      "Добавить в существующий планировщик на Kotlin разбиение задач на подзадачи с помощью ИИ: разработать интерфейс по стилю Figma и реализовать функцию.",
    category: "app",
    budget: "5 000 UAH",
    tags: ["Android", "Kotlin", "AI", "Figma"],
    source: "Freelancehunt",
    sourceUrl:
      "https://freelancehunt.com/project/zadacha-po-uluchsheniyu-prilozheniya-bloom/1658608.html",
    contactLabel: "Связаться на площадке",
    contactRestriction:
      "Отклик через аккаунт Freelancehunt. На момент проверки приём ставок указан до 27 октября; прямые контакты публично не указаны. Заказ на доработку существующего приложения.",
    checkedAt,
    kind: "Разработка",
    dateLabel: "13 октября 2026",
    clientLabel: "Катерина Зашаловская",
    featured: false,
  },
];
