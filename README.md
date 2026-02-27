# Virtual Assistant

A full-stack virtual assistant web application that handles phone calls (Twilio Voice), schedules appointments, sends SMS and email reminders, and reads and auto-responds to emails via configurable IMAP rules.

## Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 8 Web API |
| Frontend | React 19 + TypeScript (Vite) |
| Database | PostgreSQL (EF Core / Npgsql) |
| Auth | Custom JWT (BCrypt passwords) |
| Phone / SMS | Twilio Voice TwiML + SMS REST API |
| Outbound email | SendGrid |
| Inbound email | IMAP via MailKit (5-min polling) |
| Calendar UI | react-big-calendar + date-fns |
| Styling | Tailwind v4 + LESS (BEM) |

## Features

- **Appointment management** — create, edit, reschedule, and cancel appointments with calendar view
- **Phone calls** — inbound IVR menu (schedule / reschedule / voicemail), call log with recordings and transcriptions
- **SMS** — outbound reminders and inbound log
- **Email rules** — IMAP polling with regex/keyword rule matching and auto-reply templates
- **Email logs** — deduped inbox view with rule match details
- **Automatic reminders** — SMS + email sent _N_ minutes before each appointment
- **Admin settings** — user management, role/permission control, SendGrid/IMAP/Twilio config, and theme management
- **Theme system** — database-driven colour themes with live preview, CRUD, import/export as JSON

## Project Structure

```
virtual-assistant/
├── VirtualAssistant.Api/          # ASP.NET Core 8 Web API
│   ├── Controllers/               # Auth, Appointments, PhoneCalls, Email, Admin, Settings, Themes, Webhooks
│   ├── Models/                    # EF Core entities
│   ├── DTOs/                      # Request / response shapes
│   ├── Services/                  # Business logic + interfaces
│   ├── BackgroundServices/        # ImapPollingService, ReminderService
│   ├── Helpers/                   # JwtHelper, PasswordHelper, TwiMLBuilder
│   ├── Configuration/             # Strongly-typed settings classes
│   ├── Middleware/                 # Twilio signature validation
│   └── Migrations/                # EF Core migrations
└── virtual-assistant-ui/          # Vite + React + TypeScript
    └── src/
        ├── api/                   # Axios API modules per resource
        ├── auth/                  # AuthContext, useAuth, Login/Register pages
        ├── contexts/              # ThemeContext (dynamic CSS vars)
        ├── pages/                 # Dashboard, Calendar, Appointments, Email, Calls, Settings
        ├── components/            # Layout (Sidebar, TopBar, ProtectedRoute), shared UI
        ├── hooks/                 # useAppointments, useEmailRules, useEmailLogs
        ├── styles/                # LESS files (BEM-named, per-page)
        └── types/                 # Shared TypeScript interfaces
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/)
- [dotnet-ef CLI tool](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)
  ```
  dotnet tool install --global dotnet-ef
  ```

## Getting Started

### 1. Clone and configure

```bash
git clone <repo-url>
cd virtual-assistant
```

Open `VirtualAssistant.Api/appsettings.json` and fill in your values:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=virtual_assistant;Username=postgres;Password=YOUR_PASSWORD"
  },
  "JwtSettings": {
    "Secret": "AT_LEAST_32_CHARACTER_RANDOM_SECRET",
    "Issuer": "VirtualAssistant",
    "Audience": "VirtualAssistantUsers",
    "ExpiryMinutes": 1440
  },
  "TwilioSettings": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "AuthToken": "your-twilio-auth-token",
    "FromPhoneNumber": "+15551234567",
    "PublicBaseUrl": "https://your-ngrok-or-production-url"
  },
  "SendGridSettings": {
    "ApiKey": "SG.your-sendgrid-api-key",
    "FromEmail": "assistant@yourdomain.com",
    "FromName": "Virtual Assistant"
  },
  "ImapSettings": {
    "Host": "imap.gmail.com",
    "Port": 993,
    "UseSsl": true,
    "Username": "youremail@gmail.com",
    "Password": "your-app-password",
    "PollIntervalMinutes": 5
  },
  "AssistantName": "My Virtual Assistant"
}
```

> **Tip for Gmail IMAP:** use an [App Password](https://support.google.com/accounts/answer/185833) rather than your account password.

### 2. Apply database migrations

```bash
cd VirtualAssistant.Api
dotnet ef database update
```

The application also auto-migrates on startup and seeds the five built-in themes. The first registered user is automatically promoted to Admin.

### 3. Run the backend

```bash
cd VirtualAssistant.Api
dotnet run
```

API available at `http://localhost:5139`. Swagger UI at `http://localhost:5139/swagger`.

### 4. Run the frontend

```bash
cd virtual-assistant-ui
npm install
npm run dev
```

UI available at `http://localhost:5173`. The Vite dev server proxies `/api` and `/webhooks` to `http://localhost:5139`.

## Twilio Webhooks (local development)

Expose the API publicly with [ngrok](https://ngrok.com/):

```bash
ngrok http 5139
```

Copy the HTTPS URL into `TwilioSettings.PublicBaseUrl` in `appsettings.json` (or save it via the Settings → Phone Config page), then configure the following in your Twilio console:

| Event | URL |
|---|---|
| Inbound voice | `https://<ngrok>/webhooks/twilio/voice/inbound` |
| Voice status callback | `https://<ngrok>/webhooks/twilio/voice/status` |
| Recording callback | `https://<ngrok>/webhooks/twilio/voice/recording` |
| Inbound SMS | `https://<ngrok>/webhooks/twilio/sms/inbound` |

Twilio signature validation is enforced on all `/webhooks/twilio/*` routes. Requests without a valid `X-Twilio-Signature` header receive HTTP 403.

## API Reference

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | JWT | Current user |

### Appointments

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/appointments` | JWT | List (`?start=&end=` for calendar range) |
| POST | `/api/appointments` | JWT | Create |
| PUT | `/api/appointments/{id}` | JWT | Update |
| DELETE | `/api/appointments/{id}` | JWT | Cancel |
| POST | `/api/appointments/{id}/reschedule` | JWT | Reschedule + notify contact |
| POST | `/api/appointments/{id}/send-reminder` | JWT | Manual reminder |

### Phone & SMS

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/calls` | JWT | Call log |
| GET | `/api/sms` | JWT | SMS log |

### Email

| Method | Route | Auth | Description |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/api/email-rules` | JWT | CRUD email rules |
| PATCH | `/api/email-rules/{id}/toggle` | JWT | Enable / disable rule |
| GET | `/api/email-logs` | JWT | Inbound email log |

### Admin (Admin role only)

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/{id}` | Update user (role, permissions) |
| DELETE | `/api/admin/users/{id}` | Delete user |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password |
| GET | `/api/settings` | Read system settings |
| PUT | `/api/settings` | Save system settings |

### Themes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/themes` | — | List all themes |
| GET | `/api/themes/active` | — | Active theme (CSS vars) |
| POST | `/api/themes` | Admin | Create custom theme |
| PUT | `/api/themes/{id}` | Admin | Update theme |
| DELETE | `/api/themes/{id}` | Admin | Delete non-built-in theme |
| POST | `/api/themes/{id}/activate` | Admin | Set active theme |

### Webhooks

| Method | Route | Description |
|---|---|---|
| POST | `/webhooks/twilio/voice/inbound` | Inbound call → IVR TwiML |
| POST | `/webhooks/twilio/voice/gather` | Digit input handler |
| POST | `/webhooks/twilio/voice/status` | Call status update |
| POST | `/webhooks/twilio/voice/recording` | Recording ready |
| POST | `/webhooks/twilio/sms/inbound` | Inbound SMS |

## Background Services

### ReminderService (every 60 s)
Queries appointments with `Status = Scheduled` whose `StartTime` falls within the next `ReminderMinutesBefore` minutes and where `ReminderSentSms` or `ReminderSentEmail` is `false`. Sends Twilio SMS and/or SendGrid email, marks the flags, and writes a `ReminderLog` row.

### ImapPollingService (every 5 min)
1. Connects to the configured IMAP inbox via MailKit
2. Fetches `UNSEEN` messages
3. Deduplicates against `EmailLogs.MessageId`
4. Evaluates active `EmailRules` (ordered by priority) — supports Contains / StartsWith / EndsWith / Equals / Regex matching on Subject, Body, From, or Any
5. Sends an auto-reply via SendGrid when a rule matches
6. Persists the `EmailLog` row and marks the IMAP message as SEEN

## Roles & Permissions

| Field | Values | Description |
|---|---|---|
| `Role` | `Admin` / `Staff` | Admin can access Settings and manage users |
| `CanViewEmails` | bool | Show/hide email nav items |
| `CanViewCalls` | bool | Show/hide phone call nav items |
| `CanViewScheduling` | bool | Show/hide calendar and appointments |

The first registered user is automatically Admin. Permissions are embedded in the JWT so the frontend gates navigation without extra API calls.

## Themes

Five built-in themes are seeded on startup: **Ocean**, **Midnight**, **Forest**, **Sunset**, and **Lavender**. CSS variables are applied dynamically from the database — no page reload needed when switching themes. Custom themes can be created via Settings → Appearance, or imported/exported as JSON.

**Sample theme JSON format:** download `theme-sample.json` from the Appearance settings page.

## Development Commands

```bash
# Backend
dotnet run                          # Start API (auto-migrates)
dotnet ef migrations add <Name>     # Add new migration (stop server first)
dotnet ef database update           # Apply pending migrations

# Frontend
npm run dev                         # Start Vite dev server
npm run build                       # Type-check + production build
npm run lint                        # ESLint
```
