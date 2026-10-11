# Study Everyday

A visual novel-style flashcard study app built with React, TypeScript, and Vite. Kimika Tachibana from *Wonderful Everyday* (*Subarashiki Hibi*) reacts to how you are doing in the session.

## What it does

- Main menu and study screens styled after a visual novel title/options layout
- Upload lecture files (`.pptx`, `.pdf`, `.txt`, `.md`) and extract text in the browser
- Generate multiple-choice flashcards with a **Google Gemini** API key
- Grade answers locally when they match exactly; otherwise send them to Gemini
- Kimika sprites change with win/lose streaks:
  - no streak: 0–1
  - low streak: 2–5
  - high streak: 6+
- After a session, results are saved in `localStorage` so you can open them from Load

You need a Gemini key from [Google AI Studio](https://aistudio.google.com/app/apikey). The key is stored in `sessionStorage` for the current tab and is sent from your browser to Google. There is no backend of our own.

## Run it locally

Needs Node.js 18+ and npm.

```bash
git clone <your-repo-url>
cd study-everyday
npm install
npm run dev
```

Then open `http://localhost:5173`.

```bash
npm run test
npm run build
```

## How to play

1. Click **Start** on the main menu.
2. Pick a background, choose a Gemini model, and paste your API key.
3. Upload slides/notes and/or type extra focus notes, then pick how many questions you want.
4. Answer the cards. Kimika’s expression follows your streak. Breaking a high lose streak (6+ wrong in a row) uses a special sprite.

## Project layout

Most of the UI lives in `src/components`. Game state is in `src/context/GameContext.tsx`. Gemini calls are in `src/services/gemini.ts`. File parsing is in `src/parsers`. Streak and sprite helpers are in `src/utils` (those have unit tests).
