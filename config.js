/**
 * ============================================================================
 * LILY HOME — ЦЕНТРАЛЕН КОНФИГУРАЦИОНЕН ФАЙЛ (config.js)
 * ============================================================================
 * Оттук можете лесно да променяте:
 * 1. Името на съпругата Ви и всички лични текстове на сайта.
 * 2. Снимките (всички 12 лични снимки + фокусна точка за изрязване без отрязване на лицата).
 * 3. Годината и категориите на всяка снимка.
 * 4. Подредбата, любимите моменти и семейните снимки.
 * 5. Видео файловете за постоянния кинематографичен фон и секция „Моменти в движение“.
 * ============================================================================
 */

window.SITE_CONFIG = {
  // 1. ОСНОВНА ИНФОРМАЦИЯ И РЕДАКТИРУЕМИ ЛИЧНИ ТЕКСТОВЕ
  wifeName: "Лили",
  siteBrand: "LILY HOME",
  siteSubBrand: "Личен свят и семейни спомени",

  hero: {
    eyebrow: "ЛИЧЕН АЛБУМ • КИНЕМАТОГРАФИЧЕН ПОРТРЕТ",
    subtitle: "Нашите моменти. Нашата история.",
    description:
      "Едно специално място, създадено с любов — събрало усмивките, топлината, пътуванията и миговете, които правят света ни истински.",
    primaryCta: "Разгледай спомените",
    secondaryCta: "Семейният ни албум",
    scrollHint: "Плъзни надолу към нашата история",
    featuredPhotoId: "photo-13" // Снимката в 3D портретната рамка на началния екран
  },

  herWorld: {
    sectionTag: "НЕЙНИЯТ СВЯТ",
    heading: "Нежност, стил и светлина във всеки поглед",
    quote:
      "„Най-красивите места на света са онези, в които се усмихваш до мен.“",
    storyParagraph1:
      "Този интерактивен портрет е посветен на жената, която превръща всеки ден в празник на топлината и красотата. Тук всеки кадър носи своята емоция — от тихите сутрини и слънчевите брегове до уютните вечери у дома.",
    storyParagraph2:
      "Кликнете върху всяко заглавие или текст със символ за редакция, за да добавите свое лично послание, спомен или посвещение — промените се запазват автоматично във Вашия браузър.",
    portraitPhotoId: "photo-13",
    secondaryPhotoId: "photo-09",
    tertiaryPhotoId: "photo-02"
  },

  familySection: {
    sectionTag: "НАШЕТО СЕМЕЙСТВО",
    heading: "Заедно във всеки миг",
    subtitle:
      "Споделените прегръдки, морският вятър, усмивките край масата и спокойствието да бъдем един до друг. Можете да избирате кои снимки да са част от семейната колекция с един клик."
  },

  motionSection: {
    sectionTag: "МОМЕНТИ В ДВИЖЕНИЕ",
    heading: "Кинематографична фото и видео история",
    subtitle:
      "Плавно преливащи се кадри с многопластов паралакс и атмосферно видео. Когато добавите Ваши лични MP4/WebM видеоклипове в списъка по-долу, те автоматично се включват в историята."
  },

  favoritesSection: {
    sectionTag: "ЛЮБИМИ МОМЕНТИ",
    heading: "Избрани кадри от сърцето",
    subtitle:
      "Специална 3D композиция от моментите, които винаги ни карат да се усмихваме."
  },

  finaleSection: {
    sectionTag: "ЗАВИНАГИ ЗАЕДНО",
    heading: "Най-хубавото предстои",
    subtitle:
      "Всяка следваща година е нова страница от нашия семеен албум — изпълнена с още повече любов, пътувания и незабравими спомени."
  },

  // 2. ВИДЕО ФАЙЛОВЕ И КИНЕМАТОГРАФИЧЕН ФОН
  githubRepo: "gyursel/lily-home",
  videos: {
    // Постоянен кинематографичен видеофон, който съпровожда скролването
    ambientBackground: {
      mp4: "intro-film.mp4",
      webm: "", // По желание: път към .webm файл
      poster: "intro-poster.jpg",
      title: "Средиземноморска светлина и атмосфера"
    },
    // Списък с видео спомени за секция „Моменти в движение“ и албум „Видео спомени“
    memoryClips: [
      {
        id: "vid-01",
        title: "Средиземноморска приказка — 4 сцени от изгрев до звездна нощ",
        mp4: "intro-film.mp4",
        poster: "intro-poster.jpg",
        year: "2026",
        duration: "00:10",
        isAmbientFilm: true
      }
      // За да добавите ново лично видео по-късно, просто добавете нов обект тук:
      // {
      //   id: "vid-02",
      //   title: "Нашето лято край морето",
      //   mp4: "ime-na-video.mp4",
      //   poster: "IMG-08a108395de870f235f523a71db1a6d4-V.jpg",
      //   year: "2026",
      //   duration: "00:15"
      // }
    ]
  },

  // 3. ДЕФИНИЦИИ НА АЛБУМИТЕ И КАТЕГОРИИТЕ
  albums: [
    {
      id: "all",
      type: "reset",
      title: "Всички снимки",
      subtitle: "Пълната колекция от спомени",
      coverPhotoId: "photo-13"
    },
    {
      id: "2026",
      type: "year",
      value: "2026",
      title: "Снимки 2026",
      subtitle: "Потвърдена дата от 2026 г.",
      coverPhotoId: "photo-11"
    },
    {
      id: "2025",
      type: "year",
      value: "2025",
      title: "Снимки 2025",
      subtitle: "Кадри от 2025 година",
      coverPhotoId: "photo-02"
    },
    {
      id: "2024",
      type: "year",
      value: "2024",
      title: "Снимки 2024",
      subtitle: "Кадри от 2024 година",
      coverPhotoId: "photo-04"
    },
    {
      id: "unspecified",
      type: "year",
      value: "unspecified",
      title: "Без посочена година",
      subtitle: "Снимки без вградена EXIF година",
      coverPhotoId: "photo-01"
    },
    {
      id: "family",
      type: "category",
      value: "family",
      title: "Семейни снимки",
      subtitle: "Ние двамата и споделените мигове",
      coverPhotoId: "photo-07"
    },
    {
      id: "travel",
      type: "category",
      value: "travel",
      title: "Пътувания",
      subtitle: "Море, плаж, разходки и пътища",
      coverPhotoId: "photo-04"
    },
    {
      id: "special",
      type: "category",
      value: "special",
      title: "Специални моменти",
      subtitle: "Празнични вечери и красиви портрети",
      coverPhotoId: "photo-10"
    },
    {
      id: "favorites",
      type: "category",
      value: "favorites",
      title: "Любими спомени",
      subtitle: "Най-скъпите ни кадри",
      coverPhotoId: "photo-12"
    },
    {
      id: "video",
      type: "category",
      value: "video",
      title: "Видео спомени",
      subtitle: "Филмови сцени и анимирана фотоистория",
      coverPhotoId: "photo-05"
    }
  ],

  // 4. ВСИЧКИ 12+1 ПРИЛОЖЕНИ СНИМКИ В ПРОЕКТА
  // Забележка за годините:
  // - Снимките с имена IMG_2026... имат реална EXIF/файлова дата от 2026 г. -> year: "2026".
  // - Снимките от Viber/Facebook (IMG-...-V.jpg и facebook_...jpg) нямат оригинална EXIF година от заснемането,
  //   затова коректно са отбелязани с year: "unspecified" („Без посочена година“), без да се измислят години.
  //   Можете по всяко време да смените year на "2025" или "2024", ако знаете точната година.
  photos: [
    {
      id: "photo-13",
      src: "facebook_1792763701295_7519395963396826105.jpg",
      title: "Нежен поглед и естествена красота",
      caption: "Елегантен портрет край меката дневна светлина.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["special", "favorites", "video"],
      isFamily: false,
      isFavorite: true,
      focalPoint: "50% 28%", // Гарантира, че лицето винаги е идеално центрирано
      aspectRatio: "3/4",
      gridSpan: "featured"
    },
    {
      id: "photo-07",
      src: "IMG_20260316_215016.jpg",
      title: "Топла прегръдка у дома",
      caption: "Споделена вечер и усмивки един до друг.",
      year: "2026",
      dateLabel: "16 март 2026",
      categories: ["family", "favorites", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "50% 62%", // Лицата са в долната половина на вертикалния кадър
      aspectRatio: "3/4",
      gridSpan: "tall"
    },
    {
      id: "photo-01",
      src: "IMG-08a108395de870f235f523a71db1a6d4-V.jpg",
      title: "Слънчева целувка на плажа",
      caption: "Морски бриз, пясък и безгрижни летни мигове заедно.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["family", "travel", "favorites", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "50% 45%",
      aspectRatio: "4/3",
      gridSpan: "wide"
    },
    {
      id: "photo-08",
      src: "IMG_20260914_214521.jpg",
      title: "В топлината на залеза",
      caption: "Златни слънчеви лъчи и спокойствие заедно.",
      year: "2026",
      dateLabel: "14 септември 2026",
      categories: ["family", "special", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "50% 58%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-09",
      src: "IMG_20260921_185332.jpg",
      title: "Сияние и чар у дома",
      caption: "Нежна усмивка под топлата вечерна светлина.",
      year: "2026",
      dateLabel: "21 септември 2026",
      categories: ["special", "favorites", "video"],
      isFamily: false,
      isFavorite: true,
      focalPoint: "55% 38%",
      aspectRatio: "3/4",
      gridSpan: "tall"
    },
    {
      id: "photo-10",
      src: "IMG_20260930_185559.jpg",
      title: "Специална празнична атмосфера",
      caption: "Заедно на красиво място, изпълнено със светлина и настроение.",
      year: "2026",
      dateLabel: "30 септември 2026",
      categories: ["family", "special", "travel", "favorites", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "50% 55%",
      aspectRatio: "3/4",
      gridSpan: "featured"
    },
    {
      id: "photo-04",
      src: "IMG-6100748e383180b31d688baec7e0a885-V.jpg",
      title: "На брега над синьото море",
      caption: "Прегръдка с изглед към безкрайния морски хоризонт.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["family", "travel", "favorites", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "52% 48%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-11",
      src: "IMG_20261012_212209.jpg",
      title: "Близост и обич",
      caption: "Най-хубавото място винаги е в твоята прегръдка.",
      year: "2026",
      dateLabel: "12 октомври 2026",
      categories: ["family", "favorites", "video"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "50% 55%",
      aspectRatio: "3/4",
      gridSpan: "tall"
    },
    {
      id: "photo-02",
      src: "IMG-2afc162df3b815c9577819f7af3ad8b2-V.jpg",
      title: "По пътя към нови спомени",
      caption: "Красива усмивка и медальон с форма на сърце по време на пътуване.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["travel", "special", "favorites"],
      isFamily: false,
      isFavorite: true,
      focalPoint: "55% 36%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-05",
      src: "IMG-b911e5ee31d31636dc352a0e4331ea49-V.jpg",
      title: "Морско лято и слънце",
      caption: "Сияйна усмивка под белите плажни чадъри.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["travel", "special", "video"],
      isFamily: false,
      isFavorite: false,
      focalPoint: "58% 45%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-12",
      src: "IMG_20261012_213419.jpg",
      title: "Уютни вечери заедно",
      caption: "Спокойствие, топлина и споделена нежност у дома.",
      year: "2026",
      dateLabel: "12 октомври 2026",
      categories: ["family", "special", "favorites"],
      isFamily: true,
      isFavorite: true,
      focalPoint: "48% 54%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-03",
      src: "IMG-5327e9ced5bc512aebaa0855e75fa033-V.jpg",
      title: "Слънчево настроение на път",
      caption: "Стил и усмивка при всяко наше пътешествие.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["travel", "special"],
      isFamily: false,
      isFavorite: false,
      focalPoint: "54% 38%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    },
    {
      id: "photo-06",
      src: "IMG-e6193a37cb46978ff36df2774c22b714-V.jpg",
      title: "Искрена усмивка отблизо",
      caption: "Красотата в най-чистия ѝ и естествен вид.",
      year: "unspecified",
      dateLabel: "Без посочена година",
      categories: ["special", "favorites"],
      isFamily: false,
      isFavorite: true,
      focalPoint: "52% 38%",
      aspectRatio: "3/4",
      gridSpan: "normal"
    }
  ]
};
