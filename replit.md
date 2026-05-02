# Harvi — Medical Education Mobile App

## Overview
Harvi is a premium medical education platform built with Expo (React Native). It delivers high-performance quiz experiences with a "Native White" aesthetic — pure white backgrounds, sky blue accents, and premium card design.

## Architecture

### Stack
- **Framework**: Expo (Managed Workflow, SDK 54)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (Auth, Database, RPC functions)
- **Styling**: React Native StyleSheet with design tokens
- **Animations**: React Native Reanimated 4
- **Icons**: @expo/vector-icons (Feather, SF Symbols on iOS)
- **State**: React Query (@tanstack/react-query) + React Context

### Project Structure
```
artifacts/mobile/
├── app/
│   ├── _layout.tsx          # Root layout: providers (Auth, Query, SafeArea, etc.)
│   ├── auth.tsx             # Login / signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar (NativeTabs on iOS 26+, classic Tabs fallback)
│   │   ├── index.tsx        # Learn tab: curriculum hierarchy (Years → Modules → Lectures)
│   │   ├── stats.tsx        # Stats tab: dashboard with charts, mastery bars, history
│   │   └── profile.tsx      # Profile tab: user info, feedback, sign out
│   ├── year/[id].tsx        # Year detail: expandable module/lecture list
│   └── quiz/[lectureId].tsx # Quiz engine: questions, XOR decryption, results submission
├── components/
│   ├── YearCard.tsx         # Gradient bento cards for years
│   ├── LectureCard.tsx      # List cards for lectures
│   ├── StatCard.tsx         # Metric cards for stats dashboard
│   ├── WeeklyChart.tsx      # Custom bar chart for weekly activity
│   ├── MasteryBar.tsx       # Animated mastery progress bars
│   └── ErrorBoundary.tsx    # App-level error boundary
├── context/
│   └── AuthContext.tsx      # Supabase auth state + signIn/signUp/signOut
├── hooks/
│   ├── useColors.ts         # Design token hook (light theme)
│   ├── useHierarchy.ts      # React Query: fetch years/modules/lectures
│   ├── useQuiz.ts           # React Query: fetch quiz questions
│   └── useStats.ts          # React Query: fetch user stats via RPC
├── lib/
│   ├── supabase.ts          # Supabase client (AsyncStorage session)
│   └── crypto.ts            # XOR decryption for secure answer fields
├── types/index.ts           # TypeScript interfaces (Year, Module, Lecture, Question, etc.)
└── constants/colors.ts      # Design tokens: Native White palette + year gradients
```

## Supabase Schema Expected
- `years` table: id, name, order
- `modules` table: id, name, year_id, order
- `lectures` table: id, name, external_id, module_id
- `questions` table: id, text, options (text[]), secure (string), lecture_id
- `quiz_results` table: id, user_id, lecture_id, lecture_name, score, total_questions, correct_answers, created_at
- `feedback` table: id, user_id, message, created_at
- `get_user_full_stats(p_user_id)` RPC: returns total_quizzes, total_questions, average_score, best_score, streak, weekly_activity, subject_mastery, recent_results

## Security
- Quiz answers are XOR-obfuscated with key `harvi-quiz-secure-key-2024`
- Stored as base64-encoded JSON in the `secure` field of each question
- Decrypted client-side only after question is displayed

## Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase public anon key

## Design System: "Native White"
- Background: #ffffff (pure white)
- Primary/Accent: #0ea5e9 (sky blue)
- Cards: #f8fafc with subtle #e2e8f0 borders, 24px border radius
- Year gradients: Azure, Emerald, Amber, Amethyst, Pink, Teal
- Typography: Inter (400/500/600/700) with tight letter spacing
