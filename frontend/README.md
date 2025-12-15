# Voice Recorder UI - Frontend

React frontend for the Voice Recorder application with real-time audio visualization.

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   └── VoiceRecorderUI.jsx
│   ├── styles/          # CSS styles
│   │   └── index.css
│   ├── assets/          # Images, fonts, etc.
│   ├── App.jsx          # Root component
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── package.json
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── .eslintrc.cjs        # ESLint configuration
└── README.md
```

## Features

- **Real-time Audio Visualization**: Volume and pitch-driven animations
- **Audio Recording**: MediaRecorder API integration with audio processing
- **Modern UI**: Built with Tailwind CSS
- **Smooth Animations**: Powered by Framer Motion
- **Metrics Dashboard**: Display open-ended vs closed-ended question ratios

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Setup

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## API Integration

The frontend is configured to proxy API requests to the backend server:

- Backend URL: `http://localhost:8000`
- API Proxy: `/api/*` routes are forwarded to the backend

To make API calls from the frontend:
```javascript
// This will proxy to http://localhost:8000/health
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log(data))
```

## Component Structure

### VoiceRecorderUI
Main component handling:
- Microphone access and audio recording
- Real-time audio analysis and visualization
- Audio blob creation and backend communication
- Animated UI with volume/pitch-reactive effects

## Browser Compatibility

Requires browsers with support for:
- MediaDevices API (microphone access)
- Web Audio API (audio analysis)
- MediaRecorder API (audio recording)

**Note**: Microphone access requires HTTPS in production or localhost for development.

## Environment Variables

Create a `.env` file in the frontend directory if needed:
```
VITE_API_URL=http://localhost:8000
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready to be served by any static hosting service.

Preview the production build:
```bash
npm run preview
```
