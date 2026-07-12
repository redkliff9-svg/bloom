import { Lang } from '../types';

const strings = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  tab_today:      { uz: 'Bugun',        ru: 'Сегодня',   en: 'Today' },
  tab_history:    { uz: 'Tarix',        ru: 'История',   en: 'History' },
  tab_insights:   { uz: 'Tushuncha',    ru: 'Аналитика', en: 'Insights' },
  tab_challenges: { uz: 'Vazifalar',    ru: 'Задачи',    en: 'Challenges' },
  tab_settings:   { uz: 'Sozlamalar',   ru: 'Настройки', en: 'Settings' },

  // ── General ─────────────────────────────────────────────────────────────────
  save:           { uz: 'Saqlash',      ru: 'Сохранить', en: 'Save' },
  update:         { uz: 'Yangilash',    ru: 'Обновить',  en: 'Update' },
  edit:           { uz: 'Tahrirlash',   ru: 'Изменить',  en: 'Edit' },
  cancel:         { uz: 'Bekor qilish', ru: 'Отмена',    en: 'Cancel' },
  delete:         { uz: 'O\'chirish',   ru: 'Удалить',   en: 'Delete' },
  done:           { uz: 'Tayyor',       ru: 'Готово',    en: 'Done' },
  next:           { uz: 'Keyingisi',    ru: 'Далее',     en: 'Next' },
  start:          { uz: 'Boshlash',     ru: 'Начать',    en: 'Start' },
  no_entries:     { uz: 'Yozuvlar yo\'q', ru: 'Нет записей', en: 'No entries yet' },

  // ── Pain ─────────────────────────────────────────────────────────────────────
  pain_level:     { uz: 'Og\'riq darajasi', ru: 'Уровень боли',   en: 'Pain Level' },
  mild:           { uz: 'Engil',            ru: 'Лёгкая',         en: 'Mild' },
  moderate:       { uz: 'O\'rtacha',        ru: 'Умеренная',      en: 'Moderate' },
  severe:         { uz: 'Kuchli',           ru: 'Сильная',        en: 'Severe' },
  very_severe:    { uz: 'Juda kuchli',      ru: 'Очень сильная',  en: 'Very Severe' },

  // ── Pain locations ────────────────────────────────────────────────────────────
  pain_location:    { uz: 'Og\'riq joyi',      ru: 'Где болит',   en: 'Pain Location' },
  lower_abdomen:    { uz: 'Qorin pastki qismi', ru: 'Низ живота', en: 'Lower abdomen' },
  lower_back:       { uz: 'Bel',               ru: 'Поясница',    en: 'Lower back' },
  thighs:           { uz: 'Son',               ru: 'Бёдра',       en: 'Thighs' },
  pelvis:           { uz: 'Tos',               ru: 'Таз',         en: 'Pelvis' },
  upper_abdomen:    { uz: 'Qorin yuqori qismi', ru: 'Верх живота', en: 'Upper abdomen' },

  // ── Symptoms ──────────────────────────────────────────────────────────────────
  symptoms:         { uz: 'Belgilar',         ru: 'Симптомы',        en: 'Symptoms' },
  bloating:         { uz: 'Shishish',         ru: 'Вздутие',         en: 'Bloating' },
  headache:         { uz: 'Bosh og\'rig\'i',  ru: 'Головная боль',   en: 'Headache' },
  mood_swings:      { uz: 'Kayfiyat o\'zgarishi', ru: 'Перепады настроения', en: 'Mood swings' },
  nausea:           { uz: 'Ko\'ngil aynishi', ru: 'Тошнота',         en: 'Nausea' },
  fatigue:          { uz: 'Charchoq',         ru: 'Усталость',       en: 'Fatigue' },
  breast_tenderness:{ uz: 'Ko\'krak og\'rig\'i', ru: 'Болезненность груди', en: 'Breast tenderness' },

  // ── Relief methods ────────────────────────────────────────────────────────────
  relief_methods:   { uz: 'Yengillashtirish', ru: 'Как облегчила',   en: 'Relief Methods' },
  heat:             { uz: 'Issiqlik',          ru: 'Тепло',           en: 'Heat' },
  medication:       { uz: 'Dori',             ru: 'Лекарство',       en: 'Medication' },
  rest:             { uz: 'Dam olish',         ru: 'Отдых',           en: 'Rest' },
  exercise:         { uz: 'Mashq',            ru: 'Упражнения',      en: 'Exercise' },
  none:             { uz: 'Hech narsa',        ru: 'Ничего',          en: 'Nothing' },

  // ── Log screen ───────────────────────────────────────────────────────────────
  log_episode:      { uz: 'Epizod yozish',    ru: 'Записать эпизод', en: 'Log Episode' },
  daily_checkin:    { uz: 'Kunlik tekshiruv', ru: 'Дневная отметка', en: 'Daily Check-in' },
  notes:            { uz: 'Izohlar',          ru: 'Заметки',         en: 'Notes' },
  notes_placeholder:{ uz: 'Qanday his qilyapsiz?', ru: 'Как вы себя чувствуете?', en: 'How are you feeling?' },
  saved_message:    { uz: 'Saqlandi! 🌸',     ru: 'Сохранено! 🌸',  en: 'Saved! 🌸' },

  // ── Today screen ─────────────────────────────────────────────────────────────
  no_entry_today:   { uz: 'Bugun hali yozilmagan', ru: 'Сегодня нет записей', en: 'Nothing logged today' },
  todays_log:       { uz: 'Bugungi yozuvlar',      ru: 'Записи за сегодня',   en: 'Today\'s entries' },
  log_your_pain:    { uz: 'Og\'riqingizni yozing', ru: 'Запишите свою боль',  en: 'Log your pain' },
  log_cramps:       { uz: 'Og\'riq yozish',   ru: 'Записать боль',  en: 'Log cramps' },
  quick_entry:      { uz: 'Tez yozish',       ru: 'Быстрая запись', en: 'Quick entry' },
  cycle_day:        { uz: 'Sikl kuni',        ru: 'День цикла',     en: 'Cycle day' },
  todays_pain:      { uz: 'Bugungi og\'riq',  ru: 'Боль сегодня',   en: 'Today\'s pain' },

  // ── History ──────────────────────────────────────────────────────────────────
  history:          { uz: 'Tarix',            ru: 'История',        en: 'History' },
  episode:          { uz: 'Epizod',           ru: 'Эпизод',         en: 'Episode' },
  daily_summary:    { uz: 'Kunlik xulosa',    ru: 'Итог дня',       en: 'Daily summary' },

  // ── Insights ─────────────────────────────────────────────────────────────────
  insights:         { uz: 'Tushunchalar',     ru: 'Аналитика',      en: 'Insights' },
  pain_pattern:     { uz: 'Og\'riq naqshi',   ru: 'Паттерн боли',   en: 'Pain pattern' },
  tracking_streak:  { uz: 'Kuzatuv seriyasi', ru: 'Серия отслеживания', en: 'Tracking streak' },
  days_tracked:     { uz: 'Kuzatilgan kunlar', ru: 'Дней отслежено', en: 'Days tracked' },
  avg_pain:         { uz: 'O\'rtacha og\'riq', ru: 'Средняя боль',  en: 'Avg pain' },
  peak_pain:        { uz: 'Eng kuchli og\'riq', ru: 'Пиковая боль', en: 'Peak pain' },

  // ── Challenges ───────────────────────────────────────────────────────────────
  challenges:       { uz: 'Vazifalar',        ru: 'Задачи',         en: 'Challenges' },
  challenge_3day:   { uz: '3 kunlik vazifa',  ru: '3 дня подряд',   en: '3-Day Challenge' },
  challenge_7day:   { uz: '7 kunlik vazifa',  ru: '7 дней подряд',  en: '7-Day Challenge' },
  challenge_cycle:  { uz: 'To\'liq sikl',     ru: 'Полный цикл',    en: 'Full Cycle' },
  challenge_3day_desc: { uz: '3 kun ketma-ket kuzating', ru: 'Записывайте 3 дня подряд', en: 'Track 3 days in a row' },
  challenge_7day_desc: { uz: '7 kun ketma-ket kuzating', ru: 'Записывайте 7 дней подряд', en: 'Track 7 days in a row' },
  challenge_cycle_desc:{ uz: 'Butun siklni kuzating',    ru: 'Отслеживайте весь цикл',    en: 'Track your full cycle' },
  completed:        { uz: 'Bajarildi',        ru: 'Выполнено',      en: 'Completed' },
  in_progress:      { uz: 'Jarayonda',        ru: 'В процессе',     en: 'In Progress' },
  days_label:       { uz: 'kun',              ru: 'дн.',            en: 'days' },
  streak:           { uz: 'Seriya',           ru: 'Серия',          en: 'Streak' },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings:         { uz: 'Sozlamalar',       ru: 'Настройки',      en: 'Settings' },
  language:         { uz: 'Til',              ru: 'Язык',           en: 'Language' },
  notifications:    { uz: 'Bildirishnomalar', ru: 'Уведомления',    en: 'Notifications' },
  cycle_length:     { uz: 'Sikl uzunligi',    ru: 'Длина цикла',    en: 'Cycle length' },
  period_length:    { uz: 'Hayz uzunligi',    ru: 'Длина месячных', en: 'Period length' },
  last_period:      { uz: 'Oxirgi hayz',      ru: 'Последние месячные', en: 'Last period start' },

  // ── Time of day ──────────────────────────────────────────────────────────────
  morning:          { uz: 'Ertalab',          ru: 'Утро',            en: 'Morning' },
  afternoon:        { uz: 'Tushdan keyin',    ru: 'День',            en: 'Afternoon' },
  evening:          { uz: 'Kechqurun',        ru: 'Вечер',           en: 'Evening' },
  when_pain_peaks:  { uz: 'Og\'riq qachon kuchayadi', ru: 'Когда боль усиливается', en: 'When pain peaks' },
  pain_14days:      { uz: 'Og\'riq naqshi (14 kun)', ru: 'Паттерн боли (14 дней)', en: 'Pain pattern (14 days)' },

  // ── Counts & labels ───────────────────────────────────────────────────────────
  peak:             { uz: 'Eng yuqori',       ru: 'Пик',             en: 'Peak' },
  entries_today:    { uz: 'ta yozuv bugun',   ru: 'записей сегодня', en: 'entries today' },
  total_entries:    { uz: 'ta yozuv',         ru: 'записей',         en: 'entries' },
  remove_confirm:   { uz: 'Bu yozuvni o\'chirasizmi?', ru: 'Удалить эту запись?', en: 'Remove this entry?' },

  // ── Insight ───────────────────────────────────────────────────────────────────
  first_insight:    { uz: 'Birinchi tushunchangiz', ru: 'Первый инсайт', en: 'Your first insight' },
  insight_peaks_morning:   { uz: 'Og\'riqlar ko\'proq ertalab kuchayadi.',     ru: 'Боль сильнее всего утром.',       en: 'Pain tends to peak in the morning.' },
  insight_peaks_afternoon: { uz: 'Og\'riqlar ko\'proq tushdan keyin kuchayadi.', ru: 'Боль сильнее всего днём.',      en: 'Pain tends to peak in the afternoon.' },
  insight_peaks_evening:   { uz: 'Og\'riqlar ko\'proq kechqurun kuchayadi.',   ru: 'Боль сильнее всего вечером.',     en: 'Pain tends to peak in the evening.' },
  insight_top_symptom:     { uz: 'Eng tez-tez kuzatilgan beliging:',           ru: 'Самый частый симптом:',           en: 'Most common symptom:' },

  // ── Flow intensity ────────────────────────────────────────────────────────────
  flow:              { uz: 'Oqim intensivligi',  ru: 'Интенсивность',         en: 'Flow' },
  flow_spotting:     { uz: 'Tomchilab',          ru: 'Мазня',                 en: 'Spotting' },
  flow_light:        { uz: 'Kam',                ru: 'Слабый',                en: 'Light' },
  flow_medium:       { uz: "O'rtacha oqim",      ru: 'Умеренный',             en: 'Medium' },
  flow_heavy:        { uz: "Ko'p",               ru: 'Сильный',               en: 'Heavy' },

  // ── Period marking ────────────────────────────────────────────────────────────
  mark_period_start: { uz: 'Hayz boshlandi',     ru: 'Месячные начались',      en: 'Period started' },
  mark_period_end:   { uz: 'Hayz tugadi',        ru: 'Месячные закончились',   en: 'Period ended' },
  period_active:     { uz: 'Hayz davri',         ru: 'Менструация',            en: 'Period' },
  next_period:       { uz: 'Keyingi hayz',       ru: 'Следующие месячные',     en: 'Next period' },

  // ── Calendar ──────────────────────────────────────────────────────────────────
  tab_calendar:      { uz: 'Taqvim',             ru: 'Календарь',             en: 'Calendar' },
  weekdays_short:    { uz: 'Du,Se,Ch,Pa,Ju,Sh,Ya', ru: 'Пн,Вт,Ср,Чт,Пт,Сб,Вс', en: 'Mo,Tu,We,Th,Fr,Sa,Su' },
  months:            { uz: 'Yanvar,Fevral,Mart,Aprel,May,Iyun,Iyul,Avgust,Sentabr,Oktabr,Noyabr,Dekabr',
                       ru: 'Янв,Фев,Мар,Апр,Май,Июн,Июл,Авг,Сен,Окт,Ноя,Дек',
                       en: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec' },

  // ── Notification & Export ─────────────────────────────────────────────────────
  reminder_time:     { uz: 'Eslatma vaqti',      ru: 'Время напоминания',      en: 'Reminder time' },
  notif_body:        { uz: "Bugungi og'riqni yozdingizmi?", ru: 'Записали ли вы боль сегодня?', en: "Have you logged today's pain?" },
  export_data:       { uz: 'Eksport qilish',     ru: 'Экспорт данных',         en: 'Export data' },
  no_data_export:    { uz: "Eksport uchun ma'lumot yo'q", ru: 'Нет данных для экспорта', en: 'No data to export' },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  email:              { uz: 'Elektron pochta',    ru: 'Эл. почта',             en: 'Email' },
  password:           { uz: 'Parol',              ru: 'Пароль',                en: 'Password' },
  sign_in:            { uz: 'Kirish',             ru: 'Войти',                 en: 'Sign in' },
  sign_up:            { uz: 'Ro\'yxatdan o\'tish', ru: 'Создать аккаунт',     en: 'Sign up' },
  sign_out:           { uz: 'Chiqish',            ru: 'Выйти',                 en: 'Sign out' },
  have_account:       { uz: 'Akkauntingiz bormi?', ru: 'Уже есть аккаунт?',   en: 'Already have an account?' },
  no_account:         { uz: 'Akkauntingiz yo\'qmi?', ru: 'Нет аккаунта?',     en: 'No account?' },
  auth_error:         { uz: 'Xatolik yuz berdi',  ru: 'Произошла ошибка',      en: 'Something went wrong' },
  signing_in:         { uz: 'Kirish...',           ru: 'Вход...',               en: 'Signing in...' },
  signing_up:         { uz: 'Ro\'yxatdan o\'tish...', ru: 'Регистрация...',    en: 'Signing up...' },
  welcome_back:       { uz: 'Xush kelibsiz!',     ru: 'С возвращением!',       en: 'Welcome back!' },
  syncing:            { uz: 'Sinxronlash...',      ru: 'Синхронизация...',      en: 'Syncing...' },
  sync_done:          { uz: 'Sinxronlandi',        ru: 'Синхронизировано',      en: 'Synced' },
  email_invalid:      { uz: 'Email noto\'g\'ri',   ru: 'Неверный email',        en: 'Email is not correct' },
  password_invalid:   { uz: 'Parol noto\'g\'ri',   ru: 'Неверный пароль',       en: 'Password is not correct' },
  password_short:     { uz: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak', ru: 'Пароль должен содержать не менее 6 символов', en: 'Password must be at least 6 characters' },
  show_password:      { uz: 'Ko\'rish',            ru: 'Показать',              en: 'Show' },
  hide_password:      { uz: 'Yashirish',           ru: 'Скрыть',                en: 'Hide' },
  account:            { uz: 'Akkaunt',             ru: 'Аккаунт',               en: 'Account' },
  check_inbox:        { uz: 'Pochtangizni tekshiring', ru: 'Проверьте почту',   en: 'Check your inbox' },
  check_inbox_body:   { uz: 'Tasdiqlash havolasi yuborildi. Bosing va qaytib kiring.', ru: 'Ссылка для подтверждения отправлена. Нажмите её и вернитесь.', en: 'A confirmation link was sent. Click it, then come back to sign in.' },
  confirm_email_err:  { uz: 'Emailni tasdiqlang — pochtangizni tekshiring.', ru: 'Подтвердите email — проверьте почту.', en: 'Please confirm your email — check your inbox.' },

  // ── Privacy policy ───────────────────────────────────────────────────────────
  pp_storage_title:   { uz: '🔒 Ma\'lumotlarni saqlash',   ru: '🔒 Хранение данных',        en: '🔒 Data Storage' },
  pp_storage_body:    { uz: 'Blooms barcha ma\'lumotlaringizni qurilmangizda shifrlangan holda saqlaydi. Biz hech qanday shaxsiy yoki sog\'liq ma\'lumotlarini uchinchi shaxslarga, shu jumladan o\'z serverlarimizga ham uzatmaymiz.',
                        ru: 'Blooms хранит все ваши данные локально на устройстве в зашифрованном виде. Мы не собираем, не передаём и не делимся никакими личными или медицинскими данными с третьими лицами, включая наши серверы.',
                        en: 'Blooms stores all your data locally on your device using encrypted storage. We do not collect, transmit, or share any personal or health data with any third party, including our own servers.' },
  pp_notif_title:     { uz: '🔔 Bildirishnomalar',         ru: '🔔 Уведомления',             en: '🔔 Notifications' },
  pp_notif_body:      { uz: 'Eslatmalarni yoqsangiz, Blooms qurilmangizda mahalliy bildirishnomalar rejalashtiradi. Bu bildirishnomalar to\'liq qurilmada qayta ishlanadi. Hech qanday ma\'lumot tashqariga yuborilmaydi.',
                        ru: 'Если вы включите напоминания, Blooms планирует локальные уведомления на вашем устройстве. Эти уведомления обрабатываются полностью на устройстве. Никакие данные не отправляются внешним серверам.',
                        en: 'If you enable reminders, Blooms schedules local notifications on your device. These notifications are processed entirely on-device. No data is sent externally.' },
  pp_health_title:    { uz: '📊 Sog\'liq ma\'lumotlari',   ru: '📊 Данные о здоровье',       en: '📊 Health Data' },
  pp_health_body:     { uz: 'Blooms Apple Health yoki Google Fit bilan ulanmaydi. Siz kiritgan og\'riq darajalari, belgilar va sikl ma\'lumotlari faqat ilovaning mahalliy xotirasida saqlanadi.',
                        ru: 'Blooms не подключается к Apple Health или Google Fit. Уровни боли, симптомы и данные о цикле, которые вы вводите, хранятся только в локальном хранилище приложения.',
                        en: 'Blooms does not connect to Apple Health or Google Fit. Pain levels, symptoms, and cycle data you enter are stored only within the app\'s local storage.' },
  pp_export_title:    { uz: '📤 Eksport',                  ru: '📤 Экспорт',                 en: '📤 Export' },
  pp_export_body:     { uz: 'CSV eksport funksiyasi ma\'lumotlarni qurilmangizdan operatsion tizimning ulashish oynasi orqali ulashadi. Blooms eksport qilingan fayllarni qabul qilmaydi yoki saqlamaydi.',
                        ru: 'Функция экспорта CSV делится данными непосредственно с вашего устройства через системный интерфейс обмена. Blooms не получает и не хранит экспортированные файлы.',
                        en: 'The CSV export feature shares data directly from your device using your operating system\'s share sheet. Blooms does not receive or store exported files.' },
  pp_delete_title:    { uz: '🗑 O\'chirish',               ru: '🗑 Удаление',                en: '🗑 Deletion' },
  pp_delete_body:     { uz: 'Ilovani o\'chirish barcha saqlangan ma\'lumotlarni butunlay yo\'q qiladi. O\'chirishdan oldin ma\'lumotlaringizni himoya qilish uchun qurilmangizning iCloud yoki Google Drive zaxira nusxasidan foydalanishni tavsiya qilamiz.',
                        ru: 'Удаление приложения полностью удаляет все сохранённые данные. Мы рекомендуем использовать резервное копирование iCloud или Google Drive, чтобы защитить данные перед удалением.',
                        en: 'Deleting the app permanently removes all stored data. We recommend using your device\'s iCloud or Google Drive backup to protect your data before uninstalling.' },
  pp_contact_title:   { uz: '📬 Aloqa',                   ru: '📬 Контакты',                en: '📬 Contact' },
  pp_contact_body:    { uz: 'Maxfiylik bo\'yicha savollaringiz bormi? Bizga yozing: support@blooms.app',
                        ru: 'Вопросы о конфиденциальности? Напишите нам: support@blooms.app',
                        en: 'Questions about privacy? Email us at: support@blooms.app' },
  pp_updated:         { uz: 'Oxirgi yangilanish: Iyul 2025', ru: 'Последнее обновление: Июль 2025', en: 'Last updated: July 2025' },

  // ── Family ───────────────────────────────────────────────────────────────────
  family_question:    { uz: 'Oila a\'zolari uchun ham kuzatasizmi?', ru: 'Вы отслеживаете и для членов семьи?', en: 'Are you tracking for family members too?' },
  family_question_sub:{ uz: 'Har bir a\'zo uchun alohida ma\'lumotlar saqlanadi', ru: 'Для каждого члена семьи хранятся отдельные данные', en: 'Each member gets their own separate data' },
  just_me:            { uz: 'Faqat men', ru: 'Только я', en: 'Just me' },
  me_and_family:      { uz: 'Men va oilam', ru: 'Я и семья', en: 'Me and family' },
  family_mode:        { uz: 'Oilaviy rejim', ru: 'Семейный режим', en: 'Family mode' },
  add_member:         { uz: 'A\'zo qo\'shish', ru: 'Добавить участника', en: 'Add member' },
  member_name:        { uz: 'Ismi', ru: 'Имя', en: 'Name' },
  member_relation:    { uz: 'Munosabat', ru: 'Кем приходится', en: 'Relation' },
  relation_daughter:  { uz: 'Qiz', ru: 'Дочь', en: 'Daughter' },
  relation_son:       { uz: 'O\'g\'il', ru: 'Сын', en: 'Son' },
  relation_sister:    { uz: 'Singil/Opa', ru: 'Сестра', en: 'Sister' },
  relation_mother:    { uz: 'Ona', ru: 'Мама', en: 'Mother' },
  relation_other:     { uz: 'Boshqa', ru: 'Другое', en: 'Other' },
  continue_to_app:    { uz: 'Davom etish', ru: 'Продолжить', en: 'Continue' },
  tracking_for:       { uz: 'Kim uchun:', ru: 'Для кого:', en: 'Tracking for:' },
  switch_member:      { uz: 'Profil almashtirish', ru: 'Сменить профиль', en: 'Switch profile' },
  name_placeholder:   { uz: 'Ismini kiriting', ru: 'Введите имя', en: 'Enter name' },

  // ── Privacy & data ───────────────────────────────────────────────────────────
  privacy_policy:     { uz: 'Maxfiylik siyosati',   ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  data_local_title:   { uz: 'Ma\'lumotlaringiz',    ru: 'Ваши данные',                  en: 'Your data' },
  data_local_body:    { uz: 'Barcha ma\'lumotlar faqat qurilmangizda saqlanadi. Biz hech qanday ma\'lumot to\'plamaymiz.',
                        ru: 'Все данные хранятся только на вашем устройстве. Мы не собираем никаких данных.',
                        en: 'All data is stored only on your device. We never collect or transmit any personal data.' },
  data_backup_tip:    { uz: 'iCloud/Google zaxira nusxasini yoqing, aks holda ma\'lumotlar yo\'qolishi mumkin.',
                        ru: 'Включите резервное копирование iCloud/Google, иначе данные могут быть потеряны.',
                        en: 'Enable iCloud/Google backup or your data may be lost if you uninstall the app.' },
  skip:               { uz: 'O\'tkazib yuborish', ru: 'Пропустить', en: 'Skip' },
  theme:              { uz: 'Ko\'rinish',         ru: 'Оформление',      en: 'Appearance' },
  theme_system:       { uz: 'Tizim',              ru: 'Системная',       en: 'System' },
  theme_light:        { uz: 'Kunduzgi',           ru: 'Светлая',         en: 'Light' },
  theme_dark:         { uz: 'Tungi',              ru: 'Тёмная',          en: 'Dark' },

  // ── Onboarding notification bullets ──────────────────────────────────────────
  notif_bullet_daily:  { uz: '⏰ Kunlik eslatma',     ru: '⏰ Ежедневное напоминание', en: '⏰ Daily reminder' },
  notif_bullet_check:  { uz: '🌙 Kechki tekshiruv',  ru: '🌙 Вечерняя проверка',      en: '🌙 Evening check-in' },
  notif_bullet_cycle:  { uz: '📍 Sikl boshlashi',     ru: '📍 Начало цикла',           en: '📍 Cycle start' },

  // ── Onboarding ───────────────────────────────────────────────────────────────
  welcome:          { uz: 'Xush kelibsiz',    ru: 'Добро пожаловать', en: 'Welcome' },
  welcome_sub:      { uz: 'Sog\'ligingizni kuzating, o\'zingizni tushuning', ru: 'Следите за здоровьем, познавайте себя', en: 'Track your health, understand yourself' },
  choose_language:  { uz: 'Tilni tanlang',    ru: 'Выберите язык',    en: 'Choose language' },
  cycle_info:       { uz: 'Sikl ma\'lumotlari', ru: 'Данные цикла',  en: 'Cycle info' },
  cycle_info_sub:   { uz: 'Aniq bashoratlar uchun', ru: 'Для точных прогнозов', en: 'For accurate predictions' },
  enable_notifs:    { uz: 'Bildirishnomalarni yoqing', ru: 'Включите уведомления', en: 'Enable notifications' },
  notifs_sub:       { uz: 'Kuzatishni eslatib turamiz', ru: 'Напомним о записи', en: 'We\'ll remind you to track' },
  challenge_intro:  { uz: '3 kunlik vazifa boshlandi!', ru: 'Начался 3-дневный челлендж!', en: '3-Day Challenge starts now!' },
  challenge_intro_sub: { uz: '3 kun ketma-ket kuzatib, birinchi tushunchangizni oling', ru: 'Отслеживайте 3 дня подряд и получите первый инсайт', en: 'Track 3 days in a row to earn your first insight' },
  period_start_q:   { uz: 'Oxirgi hayz qachon boshlandi?', ru: 'Когда начались последние месячные?', en: 'When did your last period start?' },
  period_start_sub: { uz: 'Bu bashoratlarni aniqlashtiradi', ru: 'Это уточнит прогнозы', en: 'This helps us predict your next cycle' },
  today:            { uz: 'Bugun',               ru: 'Сегодня',          en: 'Today' },
  not_sure:         { uz: 'Aniq emas',           ru: 'Не помню',         en: 'Not sure' },
  days_ago:         { uz: 'kun oldin',           ru: 'дн. назад',        en: 'd ago' },

  // ── Coaching ──────────────────────────────────────────────────────────────────
  coaching_dismiss:    { uz: 'Tushunarli',          ru: 'Понятно',             en: 'Got it' },
  discreet_notifs:     { uz: 'Maxfiy bildirishnomalar', ru: 'Дискретные уведомления', en: 'Discreet notifications' },
  discreet_notifs_sub: { uz: 'Qulf ekranida umumiy matn ko\'rsatiladi', ru: 'На экране блокировки — общий текст', en: 'Shows neutral text on lock screen' },
  notifs_expo_go:      { uz: 'Bildirishnomalar Expo Go\'da ishlamaydi. Ular dev yoki production buildda ishlaydi.', ru: 'Уведомления не работают в Expo Go — только в dev- или production-сборке.', en: 'Push notifications need a dev or production build — they don\'t fire in Expo Go.' },

  // ── AI features ──────────────────────────────────────────────────────────────
  ai_nudge_title:   { uz: 'Bugungi maslahat',   ru: 'Совет дня',           en: 'Today\'s nudge' },
  ai_nudge_dismiss: { uz: 'Tushunarli',         ru: 'Понятно',             en: 'Got it' },
  ai_generating:    { uz: 'Tahlil qilinmoqda…', ru: 'Анализируем…',        en: 'Generating…' },
  ai_reports:       { uz: 'AI hisobotlar',      ru: 'AI-отчёты',           en: 'AI Reports' },
  ai_weekly:        { uz: 'Haftalik',           ru: 'Недельный',           en: 'Weekly' },
  ai_monthly:       { uz: 'Oylik',             ru: 'Месячный',            en: 'Monthly' },
  ai_generate_now:  { uz: 'Hozir yaratish',    ru: 'Создать сейчас',      en: 'Generate now' },
  ai_no_report:     { uz: 'Hisobot yo\'q',     ru: 'Отчёт не готов',      en: 'No report yet' },
  ai_no_report_hint:{ uz: 'Kamida 3 kun yozib «Hozir yaratish»ni bosing', ru: 'Запишите хотя бы 3 дня и нажмите «Создать сейчас»', en: 'Log at least 3 days then tap Generate now' },
  ai_error:         { uz: 'Xatolik yuz berdi', ru: 'Ошибка',              en: 'Something went wrong' },
  ai_limit_reached: { uz: 'Bugun allaqachon yaratildi', ru: 'Уже создано сегодня', en: 'Already generated today' },
  ai_improving:     { uz: 'Yaxshilanmoqda',    ru: 'Улучшается',          en: 'Improving' },
  ai_stable:        { uz: 'Barqaror',          ru: 'Стабильно',           en: 'Stable' },
  ai_worsening:     { uz: 'Yomonlashmoqda',   ru: 'Ухудшается',          en: 'Worsening' },
} as const;

type StringKey = keyof typeof strings;

export function t(key: StringKey, lang: Lang): string {
  return strings[key]?.[lang] ?? strings[key]?.['en'] ?? key;
}

export type { StringKey };
