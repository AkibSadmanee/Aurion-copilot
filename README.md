\[ Aurion is the winner of the 2025 IEEE Automatic Speech Recognition and Understanding Hackathon. The solution is built in a 36 hour coding spree and currently is not HIPAA compliant. \]


<!-- add an image here -->
<img src="aurion_certificate.jpg"></img>


# AURION

Community Health Workers (CHWs) are the heartbeat of public health. As trusted members of the communities they serve, they bridge the crucial gap between social services and the people who need them most. But today, this vital workforce is breaking under the strain. With only brief training, a single CHW acts as a lifeline for up to 20 patients a day—battling complex, outdated tools and drowning in administrative paperwork.

The result? Critical symptoms are missed in conversation, and burnout is rampant among the 65,000 CHWs currently in the field.

After deep interviews with frontline workers and the CEO of Pear Suite, we identified a critical need for support. Introducing our solution: <strong>Aurion</strong>, a real-time, LLM-powered co-pilot designed specifically for Community Health Workers.

By analyzing speech patterns, tone, and content in real-time, our tool acts as an intelligent partner during visits. It automatically detects risks across the five domains of Social Determinants of Health (SDOH) and handles the heavy lifting of documentation—filling out encounter forms and generating reports instantly. This allows CHWs to stop focusing on paperwork and start focusing on what matters most: the patient.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your computer:

### Required Software
- **Python 3.8 or higher** ([Download](https://www.python.org/downloads/))
- **Node.js 18.x or higher** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com/downloads))

### Optional but Recommended
- **Conda** or **venv** for Python virtual environment management
- A modern code editor (VS Code, Sublime Text, etc.)

### API Keys
- **OpenAI API Key** - Required for AI-powered features ([Get API Key](https://platform.openai.com/api-keys))

---

## Installation

Follow these step-by-step instructions to set up the project from scratch.

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd Aurion
```

If you don't have a remote repository yet, you can skip cloning and just navigate to the project directory.

---

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Create Python Virtual Environment

**Option A: Using Conda (Recommended)**
```bash
conda create -n chw python=3.9
conda activate chw
```

**Option B: Using venv**
```bash
python3 -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### 2.3 Install Python Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- FastAPI - Web framework
- Uvicorn - ASGI server
- WebSockets - Real-time communication
- Python-multipart - File upload support
- Python-dotenv - Environment variable management
- OpenAI - OpenAI API client

#### 2.4 Configure Environment Variables

The `.env` file is already present in the backend directory. Open it and update the following:

```bash
# Edit backend/.env
nano .env  # or use your preferred text editor
```

**Update the following value:**
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key.

**Other settings (you can keep defaults):**
- `HOST=0.0.0.0` - Server host
- `PORT=8000` - Server port
- `DEBUG=True` - Debug mode
- `CORS_ORIGINS` - Allowed origins for CORS

#### 2.5 Verify Backend Setup

Test that the backend can run:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Press `CTRL+C` to stop the server. The backend setup is complete!

---

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory

Open a new terminal window/tab, then:
```bash
cd frontend
```

(If you're in the backend directory, use `cd ../frontend`)

#### 3.2 Install Node Dependencies

**Using npm:**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

This will install:
- React & React DOM - UI framework
- Vite - Build tool and dev server
- Tailwind CSS - Utility-first CSS framework
- Framer Motion - Animation library
- Lucide React - Icon library
- React Router DOM - Routing

#### 3.3 Verify Frontend Setup

Test that the frontend can run:
```bash
npm run dev
# or
yarn dev
```

You should see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Press `CTRL+C` to stop the dev server. The frontend setup is complete!

---

## Configuration

### Backend Configuration

The backend configuration is managed through the `.env` file in the `backend/` directory.

**Key Configuration Options:**

```env
# Application Settings
APP_NAME=AURION
APP_VERSION=1.0.0
DEBUG=True

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Server Settings
HOST=0.0.0.0
PORT=8000

# CORS Settings (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4173
```

### Frontend Configuration

The frontend connects to the backend API. If you need to change the backend URL, edit the Vite configuration in `frontend/vite.config.js`.

---

## Running the Application

You need to run both the backend and frontend servers simultaneously.

### Option 1: Using Two Terminal Windows

**Terminal 1 - Backend Server:**
```bash
cd backend

# Activate virtual environment (if using conda)
conda activate chw
# or if using venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend

# Start frontend dev server
npm run dev
# or
yarn dev
```

### Option 2: Using Background Processes (Advanced)

```bash
# In the project root directory
cd backend && conda activate chw && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
cd frontend && npm run dev
```

### Accessing the Application

Once both servers are running:

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Project Structure

```
Aurion/
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── styles/               # CSS styles
│   │   ├── assets/               # Static assets
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   ├── public/                   # Public assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── routes/               # API routes (WebSocket, etc.)
│   │   └── ...
│   ├── forms/                    # Generated forms data
│   ├── recorded_sessions/        # Audio recordings storage
│   ├── generated_reports/        # AI-generated reports
│   ├── chw_sentence_db/          # ChromaDB vector database
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment configuration
│   ├── .gitignore
│   └── chroma_generate.py        # ChromaDB setup script
│
├── .gitignore
└── README.md                     # This file
```

---

## Features

### Frontend Features
- Real-time audio recording with microphone access
- Live audio visualization (waveform, volume, pitch)
- Modern, responsive UI with dark theme
- Smooth animations using Framer Motion
- Dashboard displaying conversation metrics
- Multi-page routing with React Router

### Backend Features
- FastAPI-based RESTful API
- WebSocket support for real-time communication
- CORS-enabled for cross-origin requests
- OpenAI integration for AI-powered analysis
- Audio file storage and management
- ChromaDB vector database for semantic search
- Auto-generated API documentation
- Environment-based configuration

---

## API Documentation

Once the backend server is running, you can access interactive API documentation:

### Swagger UI
Visit [http://localhost:8000/docs](http://localhost:8000/docs) for an interactive API explorer where you can:
- View all available endpoints
- Test API calls directly in the browser
- See request/response schemas

### ReDoc
Visit [http://localhost:8000/redoc](http://localhost:8000/redoc) for clean, readable API documentation.

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon components
- **React Router DOM** - Client-side routing

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - Lightning-fast ASGI server
- **WebSockets** - Real-time bidirectional communication
- **OpenAI API** - AI-powered conversation analysis
- **ChromaDB** - Vector database for embeddings
- **Python-dotenv** - Environment configuration
- **Pydantic** - Data validation

---

## Troubleshooting

### Backend Issues

**Problem: `ModuleNotFoundError` when running the backend**
```bash
# Solution: Make sure you're in the correct directory and virtual environment is activated
cd backend
conda activate chw  # or source venv/bin/activate
pip install -r requirements.txt
```

**Problem: `Port 8000 already in use`**
```bash
# Solution: Kill the process using port 8000
# On macOS/Linux:
lsof -ti:8000 | xargs kill -9
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use a different port:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Problem: OpenAI API errors**
- Verify your API key is correctly set in `backend/.env`
- Check your OpenAI account has credits
- Ensure the API key has the necessary permissions

### Frontend Issues

**Problem: `npm install` fails**
```bash
# Solution: Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem: `Port 5173 already in use`**
```bash
# Solution: Kill the process or let Vite use a different port
# Vite will automatically suggest an alternative port
```

**Problem: Cannot connect to backend**
- Verify the backend server is running on port 8000
- Check CORS settings in `backend/.env`
- Ensure frontend proxy configuration in `vite.config.js` is correct

### Browser Issues

**Problem: Microphone access denied**
- Grant microphone permissions in browser settings
- Use HTTPS in production (localhost is OK for development)
- Check browser compatibility (Chrome, Firefox, Safari, Edge)

**Problem: Audio recording not working**
- Ensure you're using a modern browser with MediaRecorder API support
- Check browser console for errors
- Verify microphone is connected and working

---

## Building for Production

### Frontend Production Build
```bash
cd frontend
npm run build
# Output will be in frontend/dist/

# Preview production build locally:
npm run preview
```

### Backend Production Deployment
```bash
cd backend
conda activate chw

# Run with multiple workers for production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Browser Requirements

The application requires a modern browser with support for:
- **MediaDevices API** - Microphone access
- **Web Audio API** - Audio analysis
- **MediaRecorder API** - Audio recording
- **WebSocket API** - Real-time communication

**Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 14+
- Edge 79+

**Note**: Microphone access requires HTTPS in production or localhost during development.

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | AURION |
| `APP_VERSION` | Application version | 1.0.0 |
| `DEBUG` | Enable debug mode | True |
| `OPENAI_API_KEY` | Your OpenAI API key | (required) |
| `HOST` | Server host | 0.0.0.0 |
| `PORT` | Server port | 8000 |
| `CORS_ORIGINS` | Allowed CORS origins | localhost URLs |

---

## Contributing

1. Create feature branches from `main`
2. Follow the existing code structure
3. Test thoroughly before committing
4. Update documentation as needed
5. Submit pull requests for review

---

## Security Notes

- The `.env` file contains sensitive information and is **already included in `.gitignore`**
- Never commit API keys or secrets to version control
- The current `.env` file has placeholder values that must be replaced
- Use environment-specific `.env` files for different deployments

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

## Quick Reference Commands

### Daily Development Workflow

```bash
# Terminal 1: Start backend
cd backend
conda activate chw
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### First Time Setup

```bash
# Backend
cd backend
conda create -n chw python=3.9
conda activate chw
pip install -r requirements.txt
# Edit .env with your OpenAI API key

# Frontend
cd frontend
npm install
```

That's it! You're ready to develop with AURION.
