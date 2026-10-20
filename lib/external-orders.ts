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

// A manually verified snapshot, not a live feed. Keep the verification date
// visible and recheck each source before presenting a listing as still open.
// Budgets below belong to the project brief, never to freelancer proposals.
const checkedAt = "2026-10-20T07:28:42.000Z";
const premiumContact = "Отклик через аккаунт Freelance.ru с Premium. Прямые контакты заказчика публично не указаны; условия доступа устанавливает исходная площадка.";
const huntContact = "Отклик и переписка через аккаунт Freelancehunt. Прямые телефон и почта заказчика публично не указаны.";

export const externalOrders: ExternalOrder[] = [
  {
    id: "freelancehunt-1657534",
    title: "ИИ-помощник для ТОО «Синтегра»",
    description: "Создать приложение для подготовки черновиков ответов на обращения пациентов на русском и казахском языках. Нужны поиск по базе примерно из 1000 нормативных актов РК, история редакций, ссылки на источники и проверка ответа сотрудником.",
    category: "app",
    budget: "Бюджет не указан",
    tags: ["AI", "RU / KZ", "База знаний"],
    source: "Freelancehunt",
    sourceUrl: "https://freelancehunt.com/project/too-sintegra/1657534.html",
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction: `${huntContact} Источник указывает завершение приёма ставок 21 октября в 11:02; часовой пояс не указан. Обсудите бюджет с заказчиком.`,
    checkedAt,
    countryCode: "KZ",
    location: "Алматы, Казахстан",
    statusLabel: "Отклики до 21 октября",
    postedAt: "2026-10-07",
    acceptingUntil: "2026-10-21",
    kind: "Разработка",
    dateLabel: "7 октября 2026",
    clientLabel: "Shynggyz Mussabekov · ТОО «Синтегра»",
    featured: true,
  },
  {
    id: "freelance-ru-13067",
    title: "Редизайн сайта BuildMaster Construction",
    description: "Обновить главную, услуги и портфолио строительной компании в существующем проекте. Нужны выразительная типографика, адаптивные страницы и плавная анимация; действующие маршруты, контент и светлая/тёмная темы должны сохраниться.",
    category: "website",
    budget: "195 000 ₽",
    tags: ["Next.js", "React", "Framer Motion"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13067",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: premiumContact,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Разработка",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: true,
  },
  {
    id: "freelancehunt-1659155",
    title: "Лендинг с оплатой Paddle и выдачей PDF",
    description: "Собрать сайт продажи цифрового товара по готовым макетам: лендинг с калькулятором, оплата через Paddle и автоматическая выдача PDF. Серверная часть на Cloudflare Workers и R2, письма через Resend, уведомления об ошибках в Telegram.",
    category: "website",
    budget: "27 000 UAH",
    tags: ["Paddle", "Cloudflare Workers", "R2"],
    source: "Freelancehunt",
    sourceUrl: "https://freelancehunt.com/project/full-stek-razrabotchik-lending-oplata-paddle/1659155.html",
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction: `${huntContact} Приём ставок указан до 29 октября, 14:18 по времени исходной площадки.`,
    checkedAt,
    countryCode: "UA",
    location: "Львов, Украина",
    statusLabel: "Отклики до 29 октября",
    postedAt: "2026-10-15",
    acceptingUntil: "2026-10-29",
    kind: "Разработка",
    dateLabel: "15 октября 2026",
    clientLabel: "Bohdan Create",
    featured: false,
  },
  {
    id: "fl-5525481",
    title: "Приложение для коллекции рыболовных приманок",
    description: "Создать мобильный каталог личной коллекции рыболовных приманок: учитывать уже имеющиеся товары и в дальнейшем подключить поиск недостающих. Заказчик предоставляет техническое задание и готов обсудить предложения по функциональности.",
    category: "app",
    budget: "По договорённости",
    tags: ["Мобильное приложение", "Каталог", "iOS"],
    source: "FL.ru",
    sourceUrl: "https://www.fl.ru/projects/5525481/razrabotka-prilojeniya-dlya-ryibolovnyih-primanok.html",
    contactLabel: "Откликнуться на FL.ru",
    contactRestriction: "Отклик через аккаунт FL.ru: кнопка на исходной странице ведёт к регистрации или входу. Прямые контакты заказчика публично не указаны.",
    checkedAt,
    statusLabel: "Отклик на площадке",
    postedAt: "2026-10-15",
    kind: "Разработка",
    dateLabel: "15 октября 2026",
    clientLabel: "Артем",
    featured: false,
  },
  {
    id: "freelance-ru-13043",
    title: "UI/UX приложения для читателей «Читариум»",
    description: "Спроектировать 14 экранов социальной платформы для читателей: каталог книг, подбор собеседников, чаты, клубы, библиотека и читалка. Результат — макеты в Figma, кликабельный прототип и передача дизайна команде React Native.",
    category: "app",
    budget: "80 000–120 000 ₽",
    tags: ["Figma", "UI / UX", "React Native"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13043",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: `${premiumContact} В тексте брифа указан ориентир 80 000–120 000 ₽ за 14 экранов и срок 5 недель. Итоговую сумму заказчик просит предложить в отклике.`,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Дизайн",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelance-ru-13005",
    title: "Интерактивный образовательный сайт на Битрикс",
    description: "Разработать сайт об устройстве теплоснабжения: интерактивные схемы, карту, анимацию и презентационный режим. Нужны адаптивная вёрстка, админ-панель с ролями, интеграции и стартовое наполнение. Общий срок в брифе — 28 дней.",
    category: "website",
    budget: "110 000 ₽ · ориентир",
    tags: ["1С-Битрикс", "Интерактив", "Админ-панель"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13005",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: `${premiumContact} Сумма 110 000 ₽ — предварительная оценка заказчика; он рассматривает обоснованные предложения по цене и срокам.`,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Разработка",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelancehunt-1658266",
    title: "Веб-платформа вертикальных микросериалов",
    description: "Запустить MVP видеосервиса: каталог, плеер с продолжением просмотра, подписка, платежи и управление контентом. Следующий этап — приложения iOS и Android с общей базой пользователей и синхронизацией прогресса.",
    category: "app",
    budget: "Бюджет не указан",
    tags: ["Веб-приложение", "Видеосервис", "Подписка"],
    source: "Freelancehunt",
    sourceUrl: "https://freelancehunt.com/project/razrabotka-web-first-platformyi-dlya-striminga-mikroserialov/1658266.html",
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction: `${huntContact} Приём ставок указан до 25 октября, 13:53 по времени исходной площадки. Сначала требуется Web MVP; мобильные приложения запланированы отдельным этапом.`,
    checkedAt,
    countryCode: "UA",
    location: "Украина · удалённо",
    statusLabel: "Отклики до 25 октября",
    postedAt: "2026-10-11",
    acceptingUntil: "2026-10-25",
    kind: "Разработка",
    dateLabel: "11 октября 2026",
    clientLabel: "Anastasiia H",
    featured: false,
  },
  {
    id: "freelance-ru-13048",
    title: "Дизайн лендинга студии интерьера",
    description: "Разработать структуру и дизайн одностраничного сайта в Figma. Нужны мобильная версия, блоки услуг, примеры работ, этапы сотрудничества, контакты и удобная форма заявки. Указанный срок — 14 дней.",
    category: "website",
    budget: "По договорённости",
    tags: ["Figma", "Лендинг", "Адаптивный дизайн"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13048",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: premiumContact,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Дизайн",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelance-ru-13026",
    title: "Обмен заказами между сайтом и 1С",
    description: "Доработать двусторонний обмен заказами между сайтом на Аспро и 1С через XML-файлы на FTP. Требуется создавать документы и переносить изменения из 1С обратно на сайт; нумерацию формирует сайт.",
    category: "website",
    budget: "По договорённости",
    tags: ["1С", "XML / FTP", "Аспро"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13026",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: premiumContact,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Доработка",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelance-ru-13054",
    title: "Публикация приложения в App Store и Google Play",
    description: "Помочь подготовить публикацию готового приложения в App Store, Google Play и RuStore. Заказчик хочет пройти необходимые шаги на созвоне и разобраться с аккаунтами разработчика, приёмом платежей и выплатами.",
    category: "app",
    budget: "По договорённости",
    tags: ["App Store", "Google Play", "RuStore"],
    source: "Freelance.ru",
    sourceUrl: "https://freelance.ru/task/view/13054",
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction: `${premiumContact} Заказчик ожидает предложения по стоимости сопровождения; указанный срок — 5 дней.`,
    checkedAt,
    statusLabel: "Отклик через Premium",
    kind: "Публикация",
    dateLabel: "Проверено 20 октября",
    clientLabel: "Заказчик на Freelance.ru",
    featured: false,
  },
  {
    id: "freelancehunt-1659090",
    title: "Тестирование Android-приложения Avtoinstructor Lite",
    description: "Организовать закрытое тестирование приложения для автоинструкторов: привлечь 12–15 владельцев Android-устройств, проверить функции в течение 14 дней, собрать ошибки и отзывы и подготовить итоговый отчёт для публикации в Google Play.",
    category: "app",
    budget: "2 000 UAH",
    tags: ["Android", "Тестирование", "Google Play"],
    source: "Freelancehunt",
    sourceUrl: "https://freelancehunt.com/project/zakryitoe-testirovanie-android-prilozheniya-google-play/1659090.html",
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction: `${huntContact} Приём ставок указан до 29 октября, 08:32 по времени исходной площадки. Это заказ на тестирование готового приложения.`,
    checkedAt,
    countryCode: "UA",
    location: "Украина · удалённо",
    statusLabel: "Отклики до 29 октября",
    postedAt: "2026-10-15",
    acceptingUntil: "2026-10-29",
    kind: "Тестирование",
    dateLabel: "15 октября 2026",
    clientLabel: "Ігор Волошенко",
    featured: false,
  },
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
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction:
      "Отклик через Freelance.ru. Площадка требует Premium и вход в аккаунт; прямые контакты публично не указаны.",
    checkedAt,
    statusLabel: "Отклик через Premium",
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
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction:
      "Отклик через аккаунт Freelancehunt. На момент проверки приём ставок указан до 30 октября; прямые контакты публично не указаны. Бюджет показан площадкой в UAH.",
    checkedAt,
    statusLabel: "Отклики до 30 октября",
    postedAt: "2026-10-16",
    acceptingUntil: "2026-10-30",
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
    contactLabel: "Откликнуться на Freelance.ru",
    contactRestriction:
      "Отклик через Freelance.ru. Площадка требует Premium и вход в аккаунт; прямые контакты публично не указаны.",
    checkedAt,
    statusLabel: "Отклик через Premium",
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
    contactLabel: "Откликнуться на Freelancehunt",
    contactRestriction:
      "Отклик через аккаунт Freelancehunt. На момент проверки приём ставок указан до 27 октября; прямые контакты публично не указаны. Заказ на доработку существующего приложения.",
    checkedAt,
    statusLabel: "Отклики до 27 октября",
    postedAt: "2026-10-13",
    acceptingUntil: "2026-10-27",
    kind: "Разработка",
    dateLabel: "13 октября 2026",
    clientLabel: "Катерина Зашаловская",
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
