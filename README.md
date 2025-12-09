# AI Education Co-Pilot

A production-grade AI learning assistant built with React, Tailwind CSS, and Gemini 3 Pro.

## Features

- **Multi-Agent AI Pipeline**: Extracts, Validates, Summarizes, and Harmonizes learning materials.
- **3-Year Career Roadmap**: Automatically generates long-term study plans based on uploaded content.
- **Master Notes**: Synthesizes conflicting sources into a single source of truth with provenance.
- **Active Recall**: Generates quizzes and flashcards on demand.

## Quick Start (Demo Mode)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file in the root:
    ```
    API_KEY=your_google_gemini_api_key
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Architecture

- **Frontend**: React 18, Tailwind CSS, Lucide Icons.
- **AI Layer**: Direct integration with `@google/genai` (Client-side for demo, Server-side capable).
- **State**: React Context/Hooks for local session management.

## Deployment

- **Frontend**: Vercel (Drag and drop the folder, ensure `API_KEY` is set in Vercel Environment Variables).
- **Backend**: Render/Railway (Upload `server/` directory, set `API_KEY` env var).

## License

MIT
