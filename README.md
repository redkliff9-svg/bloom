# 🌸 Blooms

A period and menstrual pain tracker built with React Native and Expo. Track pain levels, symptoms, flow, and relief methods. Supports multiple family members, dark mode, and three languages.

## Features

- **Pain logging** — episode or daily check-in, pain level 1–10, locations, symptoms, flow intensity, relief methods, notes
- **Calendar view** — colour-coded pain history + estimated period days
- **Insights** — 14-day trend chart, time-of-day analysis, symptom frequency, relief method usage
- **Challenges** — 3-day, 7-day, full-cycle logging streaks with dynamic insights
- **Family mode** — track pain for multiple family members under one account, switch profiles instantly
- **Dark mode** — Light / Dark / System theme picker in Settings
- **Trilingual** — Uzbek, Russian, English (switchable in Settings)
- **Cloud sync** — Supabase backend; data persists across devices when signed in
- **Data export** — CSV export via the native share sheet

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 / React Native |
| Routing | expo-router v6 (file-based) |
| Backend | Supabase (auth + Postgres) |
| Local storage | AsyncStorage |
| UI icons | @expo/vector-icons (Ionicons) |
| Notifications | expo-notifications |

## Getting started

```bash
npm install
npx expo start --tunnel   # tunnel required for Expo Go on phone
```

Use the **Expo Go** app (SDK 54) to scan the QR code. Do not upgrade the `expo` package beyond `~54.0.0`.

## Project structure

```
app/
  _layout.tsx          # Root layout, auth gate, i18n/theme context
  auth.tsx             # Sign in / sign up
  family-setup.tsx     # Family mode onboarding
  log.tsx              # Log episode modal
  privacy.tsx          # Privacy policy
  (tabs)/
    index.tsx          # Today screen
    history.tsx        # Entry history
    calendar.tsx       # Monthly calendar
    insights.tsx       # Stats & charts
    challenges.tsx     # Logging streaks
    settings.tsx       # Settings (language, theme, cycle, family, account)
src/
  constants.ts         # Shared colours, fonts, helpers
  theme.ts             # Dark/light palettes + useColors() hook
  types.ts             # TypeScript interfaces
  storage/             # AsyncStorage wrapper + Supabase sync
  i18n/                # Translations (uz / ru / en)
  contexts/            # AuthContext
  components/          # WeekStrip, BloomModal, ErrorBoundary
```

## Building for production

Requires an [Expo EAS](https://expo.dev/eas) account.

```bash
eas build --platform all --profile production
eas submit --platform all --profile production
```

Fill in your Apple credentials in `eas.json` before submitting to the App Store.

## License

MIT
