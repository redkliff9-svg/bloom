# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo SDK Version

This project uses **Expo SDK 54**. Always read the versioned docs before writing any Expo or React Native code:
https://docs.expo.dev/versions/v54.0.0/

The installed Expo Go app on the target device supports SDK 54. Do not upgrade the `expo` package beyond `~54.0.0` or the app will fail to load in Expo Go.

## Dev Commands

```bash
npx expo start --tunnel   # start dev server (tunnel required for phone testing)
npx expo install <pkg>    # install new packages — always use this, not npm install, so Expo resolves the SDK-54-compatible version
npx expo install --fix    # realign all native package versions to SDK 54
```

## Architecture

**Entry point:** `index.ts` imports `react-native-gesture-handler` first (required by React Navigation), then registers the root component via `registerRootComponent`.

**Navigation:** `App.tsx` sets up a `createBottomTabNavigator` with three screens — Today, History, Stats. The `NavigationContainer` and tab bar theming live here. No routing library beyond React Navigation is used.

**Screens** (`src/screens/`):
- `HomeScreen.tsx` — log today's entry (pain level 1–10, symptom chips, notes). Uses `useFocusEffect` to reload data each time the tab is focused.
- `HistoryScreen.tsx` — flat list of past entries, delete via `Alert` confirm.
- `StatsScreen.tsx` — derived stats (avg/peak pain, 7-day trend bar chart, symptom frequency bars), all computed in-component from the entries array.

**Data layer** (`src/storage.ts`): thin wrapper over `@react-native-async-storage/async-storage`. All entries stored as a single JSON array under the key `cramp_entries`, sorted descending by date. `saveEntry` upserts by date string. `seedDemoData` runs once on app mount (no-ops if data already exists).

**Types** (`src/types.ts`): single `CrampEntry` interface — `id`, `date` (YYYY-MM-DD string), `painLevel` (1–10), `symptoms` (string[]), `notes`, `timestamp`.

## Key Constraints

- `react-native-gesture-handler` **must** be the first import in `index.ts`, not in `App.tsx`.
- All screens share the same `PAIN_COLORS` array (index 0–9 maps to pain levels 1–10) and `painColor()` helper — keep them in sync if the palette changes.
- No navigation between screens passes route params; all screens fetch fresh data from AsyncStorage on focus.
