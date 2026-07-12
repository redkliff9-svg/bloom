import { Lang } from '../types';

export type NudgeCategory =
  | 'phase_period'
  | 'phase_pre'
  | 'phase_ovulation'
  | 'phase_luteal'
  | 'pattern'
  | 'streak'
  | 'reengagement'
  | 'education';

export interface NudgeTemplate {
  id: string;
  category: NudgeCategory;
  text: Record<Lang, (v: Record<string, string>) => string>;
  action: Record<Lang, string>;
  actionRoute?: string;
}

export const NUDGE_TEMPLATES: NudgeTemplate[] = [

  // ── Phase: Period ────────────────────────────────────────────────────────────

  {
    id: 'period_heat',
    category: 'phase_period',
    text: {
      uz: () => "Davr kunlarida issiq narsa katta yordam beradi. Qorningizga issiq yostiqcha qo'ying — bu spazmlarni tezda yumshatadi.",
      ru: () => "В дни цикла тепло — ваш лучший друг. Приложите грелку к животу — это быстро снимает спазмы.",
      en: () => "Heat is your best friend right now. Try a warm compress on your lower abdomen — it eases cramps faster than you'd expect.",
    },
    action: { uz: "Og'riqni yozish", ru: "Записать боль", en: "Log symptoms" },
    actionRoute: '/log',
  },

  {
    id: 'period_hydration',
    category: 'phase_period',
    text: {
      uz: v => `Bugun siklingizning ${v.dayOfCycle}-kuni. Ko'p suv iching — suyuqlik yo'qotish og'riqni kuchaytirishi mumkin. Engil yurish ham yordam beradi.`,
      ru: v => `Сегодня ${v.dayOfCycle}-й день цикла. Пейте больше воды — обезвоживание усиливает боль. Лёгкая прогулка тоже поможет.`,
      en: v => `Today is day ${v.dayOfCycle} of your cycle. Stay hydrated — dehydration can worsen cramping. Even a short gentle walk can help.`,
    },
    action: { uz: "Bugunni yozish", ru: "Записать день", en: "Log today" },
    actionRoute: '/log',
  },

  {
    id: 'period_rest',
    category: 'phase_period',
    text: {
      uz: () => "Dam olish zaiflik emas — bu parvarishdir. Bugun o'zingizga ruxsat bering: yotib istirobingizni tinglang va hissiyotlaringizni yozing.",
      ru: () => "Отдых — это не слабость, это забота о себе. Позвольте себе сегодня лечь и прислушаться к ощущениям — и запишите их.",
      en: () => "Rest is not weakness — it's care. Give yourself permission today to slow down, tune into your body, and log what you feel.",
    },
    action: { uz: "Yozib qo'yish", ru: "Записать", en: "Log how you feel" },
    actionRoute: '/log',
  },

  // ── Phase: Pre-period (2–3 days before) ─────────────────────────────────────

  {
    id: 'pre_stock',
    category: 'phase_pre',
    text: {
      uz: v => `Davringiz taxminan ${v.nextPeriodDay}da boshlanishi mumkin — taxminan ${v.daysUntil} kun qoldi. Issiq yostiqcha va eng yaxshi ko'rgan choyingizni tayyorlab qo'ysangiz yaxshi bo'ladi.`,
      ru: v => `Цикл может начаться примерно в ${v.nextPeriodDay} — осталось около ${v.daysUntil} дн. Хорошее время запастись грелкой и любимым чаем.`,
      en: v => `Your period may arrive around ${v.nextPeriodDay} — about ${v.daysUntil} days away. A good time to prep: stock your heat pack and favourite tea.`,
    },
    action: { uz: "Eslatma o'rnatish", ru: "Поставить напоминание", en: "Set reminder" },
  },

  {
    id: 'pre_prep',
    category: 'phase_pre',
    text: {
      uz: v => `${v.daysUntil} kun o'tgach davringiz boshlanishi kutilmoqda. Magniy va D vitamini qabul qilsangiz, og'riq yumshoqroq bo'lishi mumkin.`,
      ru: v => `Через ${v.daysUntil} дн. ожидается начало цикла. Магний и витамин D накануне могут заметно смягчить боль.`,
      en: v => `Your period is expected in about ${v.daysUntil} days. Starting magnesium and vitamin D now may reduce cramping when it arrives.`,
    },
    action: { uz: "Og'riq kuzatish", ru: "Отследить боль", en: "Track symptoms" },
    actionRoute: '/log',
  },

  // ── Phase: Ovulation ─────────────────────────────────────────────────────────

  {
    id: 'ovulation_energy',
    category: 'phase_ovulation',
    text: {
      uz: () => "Bu hafta energiyangiz yuqori bo'lishi mumkin — tuxumdon bosqichi shunday bo'ladi. Faol mashqlar yoki yangi narsalar sinab ko'rishga yaxshi vaqt.",
      ru: () => "На этой неделе у вас может быть больше энергии — это характерно для овуляторной фазы. Отличное время для активности и новых начинаний.",
      en: () => "You may feel a natural energy boost this week — that's the ovulation phase doing its thing. Great time for workouts or tackling something new.",
    },
    action: { uz: "Yaxshi his etmoqdaman", ru: "Чувствую себя хорошо", en: "Log feeling good" },
    actionRoute: '/log',
  },

  // ── Phase: Luteal ────────────────────────────────────────────────────────────

  {
    id: 'luteal_mood',
    category: 'phase_luteal',
    text: {
      uz: () => "Kayfiyat o'zgarishi va charchoq hozir odatiy holat — organizm hormonlarni moslashtirmoqda. O'zingizga mehribon bo'ling va ko'p uxlashga harakat qiling.",
      ru: () => "Перепады настроения и усталость сейчас совершенно нормальны — организм адаптируется к гормонам. Будьте добры к себе и постарайтесь больше спать.",
      en: () => "Mood shifts and fatigue are completely normal right now — your body is adjusting to hormonal changes. Be kind to yourself and prioritise sleep.",
    },
    action: { uz: "Kayfiyatni yozish", ru: "Записать настроение", en: "Log mood" },
    actionRoute: '/log',
  },

  {
    id: 'luteal_cravings',
    category: 'phase_luteal',
    text: {
      uz: () => "Shirinlikka ishtiyoq? Bu luteal bosqich — organizm qo'shimcha energiya talab qilmoqda. Shlyokaddan ko'ra qoramtir shokolad yoki yong'oq tanlang.",
      ru: () => "Тяга к сладкому? Это лютеиновая фаза — тело требует дополнительной энергии. Попробуйте тёмный шоколад или орехи вместо пустых сладостей.",
      en: () => "Craving sweets? That's the luteal phase — your body needs extra fuel. Try dark chocolate or nuts rather than reaching for empty sugars.",
    },
    action: { uz: "Bugunni yozish", ru: "Записать день", en: "Log today" },
    actionRoute: '/log',
  },

  // ── Pattern insights ─────────────────────────────────────────────────────────

  {
    id: 'pattern_headache_pre',
    category: 'pattern',
    text: {
      uz: () => "Ma'lumotlaringiz ko'rsatadiki, davr boshlanishidan 2–3 kun oldin bosh og'rig'i paydo bo'ladi. Dori va yetarli uyqu bilan tayyor bo'ling.",
      ru: () => "Данные показывают: за 2–3 дня до цикла появляется головная боль. Подготовьтесь — лекарства и достаточный сон помогут.",
      en: () => "Your logs show headaches tend to appear 2–3 days before your period. Prepare now — have pain relief ready and prioritise sleep this week.",
    },
    action: { uz: "Dori tayyorlab qo'yish", ru: "Подготовить таблетки", en: "Prepare ahead" },
  },

  {
    id: 'pattern_heat_works',
    category: 'pattern',
    text: {
      uz: () => "Siz avval issiq yostiqchadan foydalangansiz — bu og'riqni kamaytirgan. Davrning boshida yana sinab ko'ring.",
      ru: () => "Раньше вам помогала грелка. Если сейчас есть боль — попробуйте снова, это работает.",
      en: () => "You've used heat therapy before and it helped. Try it again when cramps start — it's one of the most effective tools you have.",
    },
    action: { uz: "Issiqlik ishlatish", ru: "Использовать тепло", en: "Try heat therapy" },
    actionRoute: '/log',
  },

  {
    id: 'pattern_mood_dip',
    category: 'pattern',
    text: {
      uz: () => "Ma'lumotlaringiz ko'rsatadiki, kelgusi 1–2 kunda kayfiyat pasayishi bo'lishi mumkin. Bu normal — gormonal o'zgarishlar boshlanmoqda.",
      ru: () => "По вашим данным, ближайшие 1–2 дня могут принести перепады настроения. Это нормально — гормоны перестраиваются.",
      en: () => "Your data suggests mood dips are likely in the next day or two. Completely normal — your body is shifting hormones. Extra rest and self-care help.",
    },
    action: { uz: "Kayfiyatni kuzatish", ru: "Отследить настроение", en: "Log mood" },
    actionRoute: '/log',
  },

  {
    id: 'pattern_peak_day',
    category: 'pattern',
    text: {
      uz: v => `Ma'lumotlaringiz shuni ko'rsatadiki, og'riq ko'pincha siklning ${v.peakDay}-kunida eng yuqoriga chiqadi. O'sha kun uchun oldindan tayyorgarlik ko'rishingiz mumkin.`,
      ru: v => `Ваши данные показывают, что боль обычно достигает пика на ${v.peakDay}-й день цикла. Можно заранее подготовиться к этому дню.`,
      en: v => `Your data shows pain tends to peak around day ${v.peakDay} of your cycle. You can plan ahead — have your heat pack and meds ready for that day.`,
    },
    action: { uz: "Tayyorgarlik yozish", ru: "Отметить в плане", en: "Log a note" },
    actionRoute: '/log',
  },

  {
    id: 'pattern_top_symptom',
    category: 'pattern',
    text: {
      uz: v => `Siz tez-tez ${v.symptom} qayd etgansiz. Bu naqshni bilish — unga tayyor bo'lish imkoniyatidir.`,
      ru: v => `Вы часто отмечаете ${v.symptom}. Знание этой закономерности — шанс заранее к ней подготовиться.`,
      en: v => `You've frequently logged ${v.symptom}. Recognising this pattern means you can prepare for it before it peaks.`,
    },
    action: { uz: "Belgilarni kuzatish", ru: "Отследить симптомы", en: "Track symptoms" },
    actionRoute: '/log',
  },

  {
    id: 'pattern_morning',
    category: 'pattern',
    text: {
      uz: () => "Ma'lumotlaringiz ko'rsatishicha, og'riq ertalab kuchliroq bo'ladi. Tunda issiq yostiqcha qo'yib yotish ertangi kunni yengilroq qilishi mumkin.",
      ru: () => "По вашим данным, боль сильнее утром. Грелка на ночь может сделать утро значительно легче.",
      en: () => "Your logs show pain tends to be stronger in the morning. Sleeping with a heat pack can make tomorrow morning noticeably easier.",
    },
    action: { uz: "Ertalabni yozish", ru: "Записать утро", en: "Log this morning" },
    actionRoute: '/log',
  },

  // ── Streak recognition ───────────────────────────────────────────────────────

  {
    id: 'streak_current',
    category: 'streak',
    text: {
      uz: v => `Siz ${v.streak} kun ketma-ket kuzatyapsiz 🌸 Izchillik bashoratlarni aniqroq qiladi — zo'r ish!`,
      ru: v => `Вы ведёте записи ${v.streak} дней подряд 🌸 Постоянство делает прогнозы точнее — отличная работа!`,
      en: v => `You've logged ${v.streak} days in a row 🌸 Consistent tracking makes your predictions more accurate — great work!`,
    },
    action: { uz: "Davom etish", ru: "Продолжить", en: "Keep it up" },
    actionRoute: '/log',
  },

  {
    id: 'streak_milestone',
    category: 'streak',
    text: {
      uz: v => `${v.streak} kunlik seriya — bu jiddiy ma'lumot! Siz allaqachon o'z naqshlaringizni ko'rishni boshlayapsiz.`,
      ru: v => `${v.streak} дней подряд — это уже серьёзные данные! Вы начинаете видеть свои закономерности.`,
      en: v => `${v.streak} days of tracking — that's real data! You're building a picture of your unique patterns that no one else can see.`,
    },
    action: { uz: "Tushunchalarni ko'rish", ru: "Смотреть аналитику", en: "View insights" },
    actionRoute: '/(tabs)/insights',
  },

  // ── Re-engagement ────────────────────────────────────────────────────────────

  {
    id: 'reengage_gentle',
    category: 'reengagement',
    text: {
      uz: v => `${v.daysSince} kun bo'ldi. Hech qanday muhokama yo'q — faqat siz va blooms 🌸 Bugun qanday his qilyapsiz, shuni yozib qo'ying.`,
      ru: v => `Прошло ${v.daysSince} дн. Никаких суждений — просто вы и blooms 🌸 Запишите, как вы себя чувствуете сегодня.`,
      en: v => `It's been ${v.daysSince} days. No judgement — just you and blooms 🌸 Even a quick note about how you're feeling today counts.`,
    },
    action: { uz: "Qaytib kelish", ru: "Вернуться", en: "Log today" },
    actionRoute: '/log',
  },

  {
    id: 'reengage_data',
    category: 'reengagement',
    text: {
      uz: () => "Bir necha kun o'tdi — bu yaxshi! Bugun bir daqiqa sarflasangiz, bashoratlar yana aniq bo'ladi.",
      ru: () => "Прошло несколько дней — всё хорошо! Одна минута сегодня сделает прогнозы снова точными.",
      en: () => "A few days have passed — that's okay! One minute today is all it takes to keep your predictions on track.",
    },
    action: { uz: "Tezda yozish", ru: "Быстрая запись", en: "Quick log" },
    actionRoute: '/log',
  },

  // ── Education (rotating fallback) ────────────────────────────────────────────

  {
    id: 'edu_magnesium',
    category: 'education',
    text: {
      uz: () => "Magniy tabiiy og'riq qoldiruvchi hisoblanadi. Tadqiqotlar shuni ko'rsatadiki, kunlik magniy qabuli davriy og'riqni sezilarli kamaytirishi mumkin.",
      ru: () => "Магний — природный анальгетик. Исследования показывают, что ежедневный приём магния может значительно снизить менструальную боль.",
      en: () => "Magnesium is a natural painkiller. Research shows daily magnesium supplementation can meaningfully reduce period pain over time.",
    },
    action: { uz: "Eslab qolish", ru: "Взять на заметку", en: "Got it" },
  },

  {
    id: 'edu_sleep',
    category: 'education',
    text: {
      uz: () => "Yomon uxlash og'riqni kuchaytiradi. Davr paytida 7–8 soat uxlashga harakat qiling — bu eng yaxshi davolashlardan biridir.",
      ru: () => "Плохой сон усиливает боль. Во время цикла старайтесь спать 7–8 часов — это один из лучших способов облегчить состояние.",
      en: () => "Poor sleep amplifies pain. During your period, prioritising 7–8 hours of sleep is one of the most effective things you can do.",
    },
    action: { uz: "Tushunildi", ru: "Понятно", en: "Good to know" },
  },

  {
    id: 'edu_breathing',
    category: 'education',
    text: {
      uz: () => "Chuqur nafas olish og'riqni kamaytirishi mumkin. 4 sana nafas oling, 4 sana ushlab turing, 6 sana chiqaring. Uch marta takrorlang.",
      ru: () => "Глубокое дыхание реально уменьшает боль. Вдох на 4 счёта, задержка на 4, выдох на 6. Повторите три раза.",
      en: () => "Slow breathing genuinely reduces pain perception. Try: inhale 4 counts, hold 4, exhale 6. Repeat three times when cramps hit.",
    },
    action: { uz: "Sinab ko'rish", ru: "Попробовать", en: "Try it now" },
  },

  {
    id: 'edu_cycle_phases',
    category: 'education',
    text: {
      uz: () => "Sikl 4 bosqichdan iborat: hayz, follikulyar, tuxumdon, luteal. Har birida energiya va kayfiyatingiz farq qiladi — bu normaldir.",
      ru: () => "Цикл состоит из 4 фаз: менструальной, фолликулярной, овуляторной и лютеиновой. В каждой из них уровень энергии и настроение меняются — и это нормально.",
      en: () => "Your cycle has 4 phases: menstrual, follicular, ovulation, luteal. Energy and mood naturally shift across them — tracking helps you predict these shifts.",
    },
    action: { uz: "Tushunchalarni ko'rish", ru: "Смотреть аналитику", en: "View insights" },
    actionRoute: '/(tabs)/insights',
  },

  {
    id: 'edu_heat_science',
    category: 'education',
    text: {
      uz: () => "Issiqlik nima uchun ishlaydi? U qon tomirlarini kengaytiradi va mushaklarni bo'shashtiradi, spazmlarni kamaytiradi. 40°C atrofidagi harorat eng yaxshi natija beradi.",
      ru: () => "Почему тепло работает? Оно расширяет сосуды и расслабляет мышцы, снижая спазмы. Оптимальная температура — около 40°C.",
      en: () => "Why does heat work? It dilates blood vessels and relaxes muscles, reducing spasms. Around 40°C is the sweet spot for cramp relief.",
    },
    action: { uz: "Tushunildi", ru: "Понятно", en: "Interesting!" },
  },
];
