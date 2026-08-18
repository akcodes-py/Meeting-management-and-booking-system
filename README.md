# 📅 Meeting Management & Booking System

A full-stack, production-ready scheduling and booking platform built with **Django REST Framework**, **React (Vite + Tailwind CSS + DaisyUI)**, and **MySQL**.

Hosts can manage event types, configure custom availability schedules, connect their Google Calendar for automated real-time conflict checking and Google Meet generation, and share public booking links. Invitees can view real-time available time slots and complete bookings with instant email confirmations without needing an account.

---

## 📑 Table of Contents

1. [Architecture & Features](#-architecture--features)
2. [Project Structure](#-project-structure)
3. [Technology Stack](#-technology-stack)
4. [Local Development Quickstart](#-local-development-quickstart)
5. [Environment Variables](#-environment-variables)
6. [MySQL Database Setup](#-mysql-database-setup)
7. [Google Calendar & Meet Integration](#-google-calendar--meet-integration)
8. [Email Configuration](#-email-configuration)
9. [Deployment Guide (Railway + Vercel)](#-deployment-guide)
10. [Optional: n8n Booking Reminder Workflow](#-optional-n8n-booking-reminder-workflow)
11. [API Reference & OpenAPI Docs](#-api-reference)
12. [Testing & Verification](#-testing--verification)
13. [Final Deployment Checklist](#-final-deployment-checklist)

---

## 🌟 Architecture & Features

```
┌─────────────────────────┐          HTTPS API          ┌───────────────────────────────────┐
│     React Frontend      │ ──────────────────────────> │       Django REST Backend         │
│  (Vercel / Vite / SPA)  │                             │   (Railway / Gunicorn / DRF)      │
└─────────────────────────┘                             └─────────────────┬─────────────────┘
                                                                          │
                                    ┌─────────────────────────────────────┼──────────────────────────────┐
                                    ▼                                     ▼                              ▼
                       ┌─────────────────────────┐           ┌─────────────────────────┐   ┌───────────────────────────┐
                       │      MySQL Database     │           │   Google Calendar API   │   │     Email (SMTP Provider) │
                       │  (External / Railway)   │           │   (Free/Busy, Meet link)│   │  (Confirmation / Cancel)  │
                       └─────────────────────────┘           └─────────────────────────┘   └───────────────────────────┘
```

- 🔐 **JWT Authentication**: Secure signup and login for hosts with token refresh rotation (`rest_framework_simplejwt`).
- ⚡ **Real-time Availability Engine**: Calculates non-overlapping open time slots considering host availability rules, buffer times, existing bookings, and Google Calendar busy periods.
- 📆 **Google Calendar & Google Meet**: Native OAuth 2.0 flow. Generates calendar events with Google Meet links automatically upon booking.
- ✉️ **Automated Email Notifications**: Sends confirmation and cancellation emails to invitees with cancellation tokens.
- 🌐 **Public Booking Page**: Clean, responsive booking flow accessible to anyone via `/:username/:slug`.
- 🛡️ **Production-Hardened**: Rate-limiting on public booking endpoints, WhiteNoise static assets serving, pure-Python MySQL support, dynamic CORS and CSRF configurations, and unauthenticated health check endpoints for cloud deployment.

---

## 📂 Project Structure

```text
meeting-management-and-booking-system/
│
├── backend/                             # Django REST API Backend
│   ├── manage.py                        # Django administrative CLI
│   ├── requirements.txt                 # Production Python dependencies
│   ├── Procfile                         # Gunicorn process manager definition
│   ├── railway.json                     # Railway deployment schema & start command
│   ├── railway.toml                     # Railway Nixpacks deployment config
│   ├── .env.example                     # Backend environment variable template
│   │
│   ├── config/                          # Core Django project package
│   │   ├── __init__.py                  # PyMySQL fallback loader
│   │   ├── settings.py                  # Production & development settings
│   │   ├── urls.py                      # Master routing & health check endpoints
│   │   ├── wsgi.py                      # WSGI entrypoint for Gunicorn
│   │   └── asgi.py
│   │
│   ├── accounts/                        # Custom User model & JWT authentication
│   ├── meetings/                        # EventType, Availability, Booking models & services
│   ├── calendar_integration/            # Google OAuth 2.0 & Calendar API services
│   └── templates/
│
├── frontend/                            # React Client Application
│   ├── package.json                     # Frontend dependencies and scripts
│   ├── vite.config.js                   # Vite bundler configuration & dev proxy
│   ├── vercel.json                      # Vercel SPA routing rewrite rules
│   ├── .env.example                     # Frontend environment variable template
│   └── src/
│       ├── App.jsx                      # React Router structure
│       ├── main.jsx                     # Application entrypoint
│       ├── services/api.js              # Axios API client with JWT interceptor
│       ├── services/auth.js             # Client session & token management
│       ├── pages/                       # UI pages (Dashboard, Bookings, EventTypes, Public Booking)
│       ├── components/                  # Reusable UI components & layouts
│       ├── context/                     # Toast & Theme Contexts
│       └── utils/
│
├── n8n/                                 # Optional booking reminder workflow
│   ├── README.md                        # Setup instructions for n8n
│   └── booking-reminder.workflow.json   # Exported workflow file
│
├── .gitignore                           # Git ignore rules (secrets, venv, builds)
└── README.md                            # Main project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.11+, Django 5.1, Django REST Framework, SimpleJWT, Gunicorn, WhiteNoise, `python-decouple`, `dj-database-url` |
| **Database** | MySQL 8.0+ (supported via `mysqlclient` and `PyMySQL` with `cryptography`) |
| **Frontend** | React 18, Vite 6, Tailwind CSS 4, DaisyUI 5, React Router 6, Axios, Lucide Icons |
| **Integrations** | Google Calendar API v3, Google Meet, SMTP Email (Gmail / SendGrid), OpenAPI 3.0 (drf-spectacular) |
| **Deployment** | **Vercel** (Frontend) + **Railway** (Backend) + **External MySQL** |

---

## 🚀 Local Development Quickstart

### 1. Clone Repository

```bash
git clone https://github.com/akcodes-py/Meeting-management-and-booking-system.git
cd Meeting-management-and-booking-system
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell / CMD):
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your local .env file
copy .env.example .env     # Windows
# cp .env.example .env     # macOS / Linux

# Apply database migrations
python manage.py migrate

# Start the Django API server
python manage.py runserver
```

- API Base: `http://127.0.0.1:8000/`
- Health Check: `http://127.0.0.1:8000/api/health/`
- Swagger UI Docs: `http://127.0.0.1:8000/api/v1/schema/swagger-ui/`

### 3. Frontend Setup

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node packages
npm install

# Create your local frontend .env file
copy .env.example .env     # Windows
# cp .env.example .env     # macOS / Linux

# Start the Vite development server
npm run dev
```

- Frontend UI: `http://localhost:5173/`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `SECRET_KEY` | Django secret key for cryptographic signing | `your-long-random-secret-key` |
| `DEBUG` | Toggle debug mode (`True` locally, `False` in production) | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1,.railway.app` |
| `DATABASE_URL` | MySQL connection string (preferred for cloud hosting) | `mysql://root:pass@host:3306/dbname` |
| `DB_NAME` | MySQL database name (fallback if `DATABASE_URL` is omitted) | `meeting_booking_db` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL database password | `yourpassword` |
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `CORS_ALLOW_ALL_ORIGINS` | Allow all CORS origins (must be `False` in production) | `False` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend URLs | `http://localhost:5173,https://your-frontend.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Trusted CSRF domains | `http://localhost:5173,https://your-frontend.vercel.app` |
| `FRONTEND_URL` | Frontend URL for Google OAuth browser redirect | `https://your-frontend.vercel.app` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud OAuth Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Cloud OAuth Client Secret | `your-secret` |
| `GOOGLE_OAUTH_REDIRECT_URI` | Google OAuth callback URL (registered in GCP Console) | `https://your-backend.railway.app/api/v1/calendar/callback/` |
| `EMAIL_BACKEND` | Django email backend | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_HOST_USER` | SMTP account email address | `you@gmail.com` |
| `EMAIL_HOST_PASSWORD` | SMTP app password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_USE_TLS` | Enable TLS encryption | `True` |
| `DEFAULT_FROM_EMAIL` | Sender address shown to users | `noreply@yourdomain.com` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the Django backend (no trailing slash) | `https://your-backend.railway.app` |

---

## 🗄️ MySQL Database Setup

The backend connects directly to MySQL.

### Option A: Railway MySQL / Cloud MySQL (Recommended)
Set the single `DATABASE_URL` variable in your Railway dashboard:
```env
DATABASE_URL=mysql://root:password@containers-us-west-1.railway.app:3306/railway
```

### Option B: Local or Standalone MySQL
Configure individual database parameters:
```env
DB_NAME=meeting_booking_db
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

## 📅 Google Calendar & Meet Integration

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API**.
3. Under **APIs & Services > Credentials**, create an **OAuth 2.0 Client ID** (Web application).
4. Add the following to **Authorized redirect URIs**:
   - **Local Development**: `http://localhost:8000/api/v1/calendar/callback/`
   - **Production (Railway)**: `https://your-backend.railway.app/api/v1/calendar/callback/`
5. Copy your **Client ID** and **Client Secret** into your backend environment variables (`GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`).
6. Set `FRONTEND_URL` so that when a host connects their calendar, Google redirects back to the Django callback, which then routes the browser back to `https://your-frontend.vercel.app/settings?calendar=connected`.

---

## ✉️ Email Configuration

### Development Mode
In development, set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`. Confirmation and cancellation emails will be printed directly to the terminal console.

### Production (Gmail SMTP)
1. Enable **2-Step Verification** on your Google account.
2. Generate an **App Password** under **Security > 2-Step Verification > App Passwords**.
3. Configure the following environment variables in Railway:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=youraccount@gmail.com
   EMAIL_HOST_PASSWORD=your-16-character-app-password
   EMAIL_USE_TLS=True
   DEFAULT_FROM_EMAIL="Meeting Scheduler <youraccount@gmail.com>"
   ```

---

## 🚢 Deployment Guide

### 1. Railway Deployment (Backend API)

1. Sign up / log in to [Railway](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo** and select this repository.
3. In **Settings > General**:
   - **Root Directory**: `backend`
4. Railway automatically detects `railway.toml` / `railway.json` / `Procfile`:
   - **Start Command**: `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - **Healthcheck Path**: `/api/health/`
5. In **Variables**, add all backend environment variables listed in the [Environment Variables](#-environment-variables) section.
6. In **Settings > Networking**, generate a public domain (e.g. `your-backend.railway.app`).

### 2. Vercel Deployment (Frontend UI)

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and import your repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend.railway.app`
5. Click **Deploy**. Vercel will build the frontend. `frontend/vercel.json` ensures that all React Router client routes resolve properly.
6. Once deployed, copy your Vercel URL (e.g. `https://your-frontend.vercel.app`) and update `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and `FRONTEND_URL` in your Railway variables.

---

## 🤖 Optional: n8n Booking Reminder Workflow

The `n8n/` directory contains an optional automated booking reminder workflow:
- **File**: `n8n/booking-reminder.workflow.json`
- **Functionality**: Runs on a schedule (e.g. every 15 minutes), queries `POST /api/v1/bookings/reminders-due/` with host credentials, and sends reminder emails to invitees with meeting details.
- For complete setup instructions, refer to [`n8n/README.md`](file:///c:/Users/Atul%20Kumar/OneDrive/Desktop/Meeting%20management%20and%20booking%20system/n8n/README.md).
- *Note: This workflow is purely optional and not required to run or deploy the core application.*

---

## 📖 API Reference

All REST endpoints live under `/api/v1/`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/` | Health check endpoint for load balancers | No |
| `POST` | `/api/v1/auth/signup/` | Register host account & return JWT | No |
| `POST` | `/api/v1/auth/login/` | Log in host & return JWT | No |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh JWT access token | No |
| `GET/POST` | `/api/v1/event-types/` | List or create event types | Yes (JWT) |
| `GET/PATCH/DELETE` | `/api/v1/event-types/{id}/` | Retrieve, update, or delete event type | Yes (JWT) |
| `GET/POST/DELETE` | `/api/v1/availability/` | Manage weekly availability rules | Yes (JWT) |
| `GET` | `/api/v1/calendar/connect/` | Initiate Google OAuth flow | Yes (JWT) |
| `GET` | `/api/v1/calendar/callback/` | Google OAuth callback handler | No (Signed state) |
| `GET` | `/api/v1/calendar/status/` | Check Google Calendar connection status | Yes (JWT) |
| `POST` | `/api/v1/calendar/disconnect/` | Disconnect Google Calendar | Yes (JWT) |
| `GET` | `/api/v1/public/{username}/{slug}/` | Fetch public event type details | No |
| `GET` | `/api/v1/public/{username}/{slug}/availability/` | Get calculated available time slots | No |
| `POST` | `/api/v1/public/{username}/{slug}/book/` | Book a time slot as an invitee | No |
| `POST` | `/api/v1/bookings/{id}/cancel/` | Cancel booking (host or invitee token) | No / JWT |
| `GET` | `/api/v1/bookings/` | List all bookings for host | Yes (JWT) |
| `GET` | `/api/v1/bookings/upcoming/` | List upcoming confirmed bookings | Yes (JWT) |
| `POST` | `/api/v1/bookings/reminders-due/` | Claim bookings due for reminder | Yes (JWT) |

Interactive documentation is available at:
- **Swagger UI**: `/api/v1/schema/swagger-ui/`
- **ReDoc**: `/api/v1/schema/redoc/`

---

## 🧪 Testing & Verification

### Backend Verification
```bash
cd backend
python manage.py check                     # Verify Django system integrity
python manage.py makemigrations --check    # Check for missing migrations
python manage.py collectstatic --noinput   # Verify WhiteNoise static asset collection
python manage.py test                      # Run complete test suite (42 tests)
```

### Frontend Verification
```bash
cd frontend
npm install
npm run build                              # Compile production bundle to dist/
```

---

## ✅ Final Deployment Checklist

```text
GitHub
[ ] Repository pushed to GitHub
[ ] .env files excluded and not committed

Railway (Backend)
[ ] Django service created with Root Directory: backend
[ ] MySQL credentials configured (via DATABASE_URL or DB_* variables)
[ ] Backend environment variables added (SECRET_KEY, ALLOWED_HOSTS, CORS, etc.)
[ ] Migrations completed automatically on deploy
[ ] Static files collected with WhiteNoise
[ ] Gunicorn running on 0.0.0.0:$PORT
[ ] Railway public domain generated
[ ] /api/health/ returns {"status": "ok"}

Vercel (Frontend)
[ ] Frontend connected to GitHub with Root Directory: frontend
[ ] VITE_API_URL configured pointing to Railway backend
[ ] npm run build succeeds and produces dist/
[ ] Vercel public domain generated
[ ] Client-side SPA routes work via vercel.json

Integration & Third-Party
[ ] CORS_ALLOWED_ORIGINS updated on Railway with Vercel domain
[ ] CSRF_TRUSTED_ORIGINS updated on Railway with Vercel domain
[ ] FRONTEND_URL updated on Railway with Vercel domain
[ ] Google OAuth production redirect URI added to Google Cloud Console
[ ] Production SMTP email credentials verified
[ ] Host login, event creation, and public booking flow verified end-to-end
```