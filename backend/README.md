# MomCare Backend

Backend for the MomCare MVP. The existing backend stack is Node.js + Express, so this project keeps Express and adds TypeScript, PostgreSQL, and Prisma.

## Requirements

- Node.js 20+
- Docker Desktop with Docker Compose

PostgreSQL is started through Docker Compose, so a manual local PostgreSQL installation is not required.

## Install Dependencies

```bash
cd backend
npm install
```

## Environment

Create a local `.env` file from the example:

```bash
cd backend
cp .env.example .env
```

Minimum variables:

```env
DATABASE_URL="postgresql://momcare:momcare_password@localhost:5432/momcare_db"
JWT_ACCESS_SECRET="replace_with_local_access_secret"
JWT_REFRESH_SECRET="replace_with_local_refresh_secret"
PORT=3000
```

Do not commit `.env`.

## Start PostgreSQL

```bash
cd backend
docker compose up -d
```

Database settings:

- database: `momcare_db`
- user: `momcare`
- password: `momcare_password`
- port: `5432`

Data is stored in the `momcare_postgres_data` Docker volume.

## Prisma

Generate Prisma Client:

```bash
cd backend
npm run prisma:generate
```

Run migrations:

```bash
cd backend
npm run prisma:migrate
```

The initial migration creates MVP tables for users, pregnancy profiles, diary entries, visits, doctor questions, checklist items, and articles.

The migration `20260721100000_add_checklist_category_doctor` adds the `DOCTOR` value to the `ChecklistCategory` enum so that checklist items can be tagged as doctor-related tasks.

The migration `20260923160000_expand_diary_entry` extends the diary: it adds `wellbeingRating`, `sleepQuality`, `waterMl`, `medicationStatus`, and `basalTemperatureC`, moves the energy level to the `1..5` scale, moves symptoms to the `diary_symptom_entries` table with a severity, extends the mood and symptom enums, normalizes stored dates to the user's calendar day, and adds the unique constraint `userId + entryDate` (duplicates keep the most recently updated entry). Legacy rows receive neutral values for the new required fields (`wellbeingRating = 3`, `energyLevel = 3`, `sleepQuality = 'FAIR'`, `sleepHours = 7`) without any interpretation.

The migration `20261013120000_add_diary_moods` replaces the single diary `mood` column with a `moods` array: existing rows are backfilled from their `mood` value (a one-element array), and the single `mood` column is then dropped.

Seed reference content after migrations:

```bash
cd backend
npm run seed
```

For a clean local database check:

```bash
cd backend
npx prisma migrate reset
npm run seed
```

## Run Backend

Development:

```bash
cd backend
npm run dev
```

Production build smoke check:

```bash
cd backend
npm run build
npm start
```

## Health Check

With the backend running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Local Development Base URLs

CORS is enabled for local development in `src/app.module.ts`.

Use these base URLs when the mobile frontend is ready to connect:

- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Physical device: `http://<computer-lan-ip>:3000`
- Web/local testing: `http://localhost:3000`

For a physical device, keep the phone and computer on the same network and allow inbound traffic to the backend port in the local firewall.

## Endpoint Summary

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /pregnancy-profile`
- `POST /pregnancy-profile`
- `PATCH /pregnancy-profile`
- `GET /diary`
- `GET /diary?date=YYYY-MM-DD`
- `GET /diary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
- `POST /diary`
- `GET /diary/:id`
- `PATCH /diary/:id`
- `DELETE /diary/:id`
- `GET /visits`
- `GET /visits/upcoming`
- `POST /visits`
- `GET /visits/:id`
- `PATCH /visits/:id`
- `DELETE /visits/:id`
- `GET /doctor-questions`
- `POST /doctor-questions`
- `GET /doctor-questions/:id`
- `PATCH /doctor-questions/:id`
- `DELETE /doctor-questions/:id`
- `GET /pregnancy-weeks/current`
- `GET /pregnancy-weeks/current/daily-tip?date=YYYY-MM-DD`
- `GET /pregnancy-weeks/:week`
- `GET /checklists?week=27`
- `PATCH /checklists/:id/toggle`
- `GET /articles`
- `GET /articles/:id`

## Full Local Startup Checklist

```powershell
cd C:\work\momcare\backend
npm install
Copy-Item .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Check health:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/health"
```

## Auth

MOM-14 implements basic email/password auth with bcrypt password hashing and JWT access tokens.

Refresh tokens are not issued yet. `JWT_REFRESH_SECRET` is already present in `.env.example` for the next auth iteration.

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mama@example.com\",\"password\":\"StrongPass123\",\"name\":\"Анна\"}"
```

Expected response shape:

```json
{
  "user": {
    "id": "uuid",
    "email": "mama@example.com",
    "name": "Анна",
    "role": "USER",
    "createdAt": "2026-07-03T00:00:00.000Z",
    "updatedAt": "2026-07-03T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mama@example.com\",\"password\":\"StrongPass123\"}"
```

### Current User

Use the access token from register or login:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer jwt-access-token"
```

Expected response shape:

```json
{
  "user": {
    "id": "uuid",
    "email": "mama@example.com",
    "name": "Анна",
    "role": "USER",
    "createdAt": "2026-07-03T00:00:00.000Z",
    "updatedAt": "2026-07-03T00:00:00.000Z"
  }
}
```

Errors:

- `400` for invalid DTO input
- `401` for invalid credentials or invalid token
- `409` when email is already registered

## Pregnancy Profile

MOM-15 implements a protected pregnancy profile API. Every request uses the current user from the JWT access token, so users can only read or update their own profile.

The API field `lastMenstrualPeriod` is stored in Prisma as `lastPeriodStartDate`. `pregnancyWeek`, `pregnancyDay`, and `trimester` are calculated on the backend. Clients must not send calculated fields manually.

If a profile does not exist, `GET /pregnancy-profile` returns:

```json
{
  "profile": null
}
```

### PowerShell Setup

Register or login and save the access token:

```powershell
$authBody = @{
  email = "mama@example.com"
  password = "StrongPass123"
  name = "Anna"
} | ConvertTo-Json

$auth = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/auth/register" `
  -ContentType "application/json" `
  -Body $authBody

$token = $auth.tokens.accessToken
```

If the user already exists, login instead:

```powershell
$loginBody = @{
  email = "mama@example.com"
  password = "StrongPass123"
} | ConvertTo-Json

$auth = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

$token = $auth.tokens.accessToken
```

### Create Pregnancy Profile

```powershell
$profileBody = @{
  lastMenstrualPeriod = "2026-01-01"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/pregnancy-profile" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $profileBody
```

For `lastMenstrualPeriod = "2026-01-01"`, the expected calculated `dueDate` is `"2026-10-08"`.

You can also create from `dueDate`:

```powershell
$profileBody = @{
  dueDate = "2026-10-08"
} | ConvertTo-Json
```

### Get Pregnancy Profile

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/pregnancy-profile" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Update Pregnancy Profile

```powershell
$updateBody = @{
  dueDate = "2026-10-10"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/pregnancy-profile" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $updateBody
```

Expected response shape:

```json
{
  "profile": {
    "id": "uuid",
    "lastMenstrualPeriod": "2026-01-01",
    "dueDate": "2026-10-08",
    "pregnancyWeek": 27,
    "pregnancyDay": 3,
    "trimester": 2,
    "createdAt": "2026-07-05T00:00:00.000Z",
    "updatedAt": "2026-07-05T00:00:00.000Z"
  }
}
```

### Check Pregnancy Day Calculation

For current date `2026-07-05`, `lastMenstrualPeriod = "2026-01-02"` should return:

- `dueDate = "2026-10-09"`
- `pregnancyWeek = 27`
- `pregnancyDay = 2`
- `trimester = 2`

PowerShell check:

```powershell
$body = @{
  lastMenstrualPeriod = "2026-01-02"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/pregnancy-profile" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/pregnancy-profile" `
  -Headers @{ Authorization = "Bearer $token" }
```

`GET /pregnancy-profile` recalculates pregnancy values on the backend before returning the response, so `pregnancyDay` should not be `null`.

Errors:

- `400` for invalid DTO input
- `401` for missing or invalid JWT
- `404` when updating a missing profile
- `409` when trying to create a second profile

Edge cases to check:

```powershell
# Invalid date
$body = @{ lastMenstrualPeriod = "2026-02-31" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/pregnancy-profile" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Future last menstrual period
$body = @{ lastMenstrualPeriod = "2099-01-01" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/pregnancy-profile" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Manually provided calculated fields are rejected
$body = @{ lastMenstrualPeriod = "2026-01-01"; pregnancyWeek = 10; trimester = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/pregnancy-profile" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# More than 40 weeks is allowed and returns trimester = 3
$body = @{ lastMenstrualPeriod = "2025-08-01" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/pregnancy-profile" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Creating a second profile returns 409
$body = @{ dueDate = "2026-10-08" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/pregnancy-profile" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
```

## Diary

MOM-18 implements a protected wellbeing diary API. Every request uses the current user from the JWT access token. The API never accepts `userId` from the request body.

### One entry per calendar day

A user can have only one entry per calendar day:

- the `date` value is the user's calendar date in `YYYY-MM-DD` format, not the server timezone;
- `POST /diary` for a date that already has an entry returns `409` and the id of the existing entry so the frontend can open it for editing;
- `PATCH /diary/:id` can edit the entry during the same day, including changing `date`;
- moving an entry with `PATCH` to a date that already has another entry also returns `409`;
- after `DELETE /diary/:id` the date becomes free again;
- uniqueness is per user: two different users can keep entries for the same date.

### Storage responsibility

The backend stores exactly what the user entered and makes no medical conclusions. It does not recommend medication, does not store automatically assigned doses, does not interpret a missed dose, and does not build a schedule. Reminders are not implemented in this task.

### Diary entry contract

```json
{
  "date": "2026-09-22",
  "wellbeingRating": 4,
  "moods": ["CALM", "GRATEFUL"],
  "energyLevel": 3,
  "sleepHours": 7.5,
  "sleepQuality": "GOOD",
  "symptoms": [
    {
      "type": "NAUSEA",
      "severity": "MILD"
    }
  ],
  "waterMl": 1500,
  "medicationStatus": "ON_TIME",
  "weightKg": 65.3,
  "basalTemperatureC": 36.7,
  "note": "Сегодня чувствовала себя лучше"
}
```

| Field | Type | Required on create | Validation |
| --- | --- | --- | --- |
| `date` | string | yes | `YYYY-MM-DD`, valid calendar date |
| `wellbeingRating` | integer | yes | `1..5` |
| `moods` | array of enums | yes | non-empty array of unique mood values |
| `energyLevel` | integer | yes | `1..5` |
| `sleepHours` | number | yes | `0..24` |
| `sleepQuality` | enum | yes | `POOR`, `FAIR`, `GOOD`, `EXCELLENT` |
| `symptoms` | array | no (defaults to `[]`) | objects `{ "type", "severity" }`, types must be unique |
| `waterMl` | integer | no | non-negative |
| `medicationStatus` | enum | no | `ON_TIME`, `LATE`, `MISSED`, `NOT_APPLICABLE` |
| `weightKg` | number | no | positive |
| `basalTemperatureC` | number | no | numeric value |
| `note` | string | no | free text |

In `PATCH`, any field may be omitted to keep its current value. Nullable fields (`symptoms`, `waterMl`, `medicationStatus`, `weightKg`, `basalTemperatureC`, `note`) accept `null` to clear the value. At least one field is required, otherwise `400`.

The canonical mood field is the `moods` array. The legacy single `mood` field is still accepted on create/update (it becomes a one-element `moods` list) and is still returned in every response as the first mood (`moods[0]`), or `null` when the array is empty. When both `moods` and `mood` are sent, `moods` wins. An empty `moods` array, duplicate values, or unknown values return `400`.

Tiredness is not a mood: it is reflected by `energyLevel` and by the `FATIGUE` symptom.

`moods` values are one of:

`JOYFUL`, `CALM`, `NEUTRAL`, `SAD`, `ANXIOUS`, `IRRITATED`, `OVERWHELMED`, `HOPEFUL`, `GRATEFUL`, `RELAXED`, `EXCITED`, `CONFIDENT`, `SENSITIVE`, `LONELY`

`symptoms[].type` is one of:

`NAUSEA`, `VOMITING`, `FATIGUE`, `HEADACHE`, `DIZZINESS`, `HEARTBURN`, `BACK_PAIN`, `ABDOMINAL_DISCOMFORT`, `SHORTNESS_OF_BREATH`, `SWELLING`, `FREQUENT_URINATION`, `SLEEP_PROBLEMS`, `CONSTIPATION`, `LEG_CRAMPS`, `OTHER`

`symptoms[].severity` is one of:

`MILD`, `MODERATE`, `SEVERE`

### Create Diary Entry

```powershell
$body = @{
  date = "2026-09-22"
  wellbeingRating = 4
  mood = "CALM"
  energyLevel = 3
  sleepHours = 7.5
  sleepQuality = "GOOD"
  symptoms = @(@{ type = "NAUSEA"; severity = "MILD" })
  waterMl = 1500
  medicationStatus = "ON_TIME"
  weightKg = 65.3
  basalTemperatureC = 36.7
  note = "Сегодня чувствовала себя лучше"
} | ConvertTo-Json -Depth 5

$createdDiaryEntry = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/diary" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body

$diaryEntryId = $createdDiaryEntry.entry.id
```

Expected response shape:

```json
{
  "entry": {
    "id": "uuid",
    "date": "2026-09-22",
    "wellbeingRating": 4,
    "mood": "CALM",
    "energyLevel": 3,
    "sleepHours": 7.5,
    "sleepQuality": "GOOD",
    "symptoms": [{ "type": "NAUSEA", "severity": "MILD" }],
    "waterMl": 1500,
    "medicationStatus": "ON_TIME",
    "weightKg": 65.3,
    "basalTemperatureC": 36.7,
    "note": "Сегодня чувствовала себя лучше",
    "createdAt": "2026-09-22T00:00:00.000Z",
    "updatedAt": "2026-09-22T00:00:00.000Z"
  }
}
```

Creating a second entry for the same date returns `409` with the existing entry id:

```json
{
  "message": "Diary entry for this date already exists",
  "entryId": "uuid-of-the-existing-entry"
}
```

### List Diary Entries

Returns the current user's entries sorted from newest to oldest by `date`.

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/diary" `
  -Headers @{ Authorization = "Bearer $token" }
```

Expected response shape:

```json
{
  "entries": [
    {
      "id": "uuid",
      "date": "2026-09-22",
      "wellbeingRating": 4,
      "mood": "CALM",
      "energyLevel": 3,
      "sleepHours": 7.5,
      "sleepQuality": "GOOD",
      "symptoms": [{ "type": "NAUSEA", "severity": "MILD" }],
      "waterMl": 1500,
      "medicationStatus": "ON_TIME",
      "weightKg": 65.3,
      "basalTemperatureC": 36.7,
      "note": "Сегодня чувствовала себя лучше",
      "createdAt": "2026-09-22T00:00:00.000Z",
      "updatedAt": "2026-09-22T00:00:00.000Z"
    }
  ]
}
```

### Entries for one date or a period

```powershell
# One specific date
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/diary?date=2026-09-22" `
  -Headers @{ Authorization = "Bearer $token" }

# Inclusive period
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/diary?dateFrom=2026-09-01&dateTo=2026-09-22" `
  -Headers @{ Authorization = "Bearer $token" }
```

`date`, `dateFrom`, and `dateTo` are optional `YYYY-MM-DD` values. `date` is used as both bounds when the corresponding bound is not sent. Invalid values or `dateFrom` later than `dateTo` return `400`.

### Get One Diary Entry

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/diary/$diaryEntryId" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Update Diary Entry

```powershell
$body = @{
  wellbeingRating = 2
  mood = "OVERWHELMED"
  energyLevel = 1
  sleepHours = 6
  sleepQuality = "POOR"
  symptoms = @(
    @{ type = "HEADACHE"; severity = "SEVERE" },
    @{ type = "NAUSEA"; severity = "MODERATE" }
  )
  waterMl = $null
  note = "Была тревожность, запишу вопрос врачу"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/diary/$diaryEntryId" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

Sending `symptoms` replaces the whole list together with severities.

### Delete Diary Entry

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:3000/diary/$diaryEntryId" `
  -Headers @{ Authorization = "Bearer $token" }
```

Errors:

- `400` for invalid DTO input, invalid enum values, invalid `YYYY-MM-DD` dates, or invalid filter values
- `401` for missing or invalid JWT
- `404` when the diary entry does not exist or belongs to another user
- `409` when the user already has an entry for that date; the body contains `entryId`

Edge cases to check:

```powershell
# Second entry for the same date returns 409 with the existing entry id
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/diary" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Rating outside 1..5 returns 400
$body = @{ date = "2026-09-22"; wellbeingRating = 6; mood = "CALM"; energyLevel = 3; sleepHours = 7; sleepQuality = "GOOD" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/diary" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Symptom without severity returns 400
$body = @{ date = "2026-09-22"; wellbeingRating = 4; mood = "CALM"; energyLevel = 3; sleepHours = 7; sleepQuality = "GOOD"; symptoms = @(@{ type = "NAUSEA" }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/diary" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body

# Entry of another user returns 404
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/diary/$diaryEntryId" -Headers @{ Authorization = "Bearer $otherUserToken" }
```

## Visits

MOM-20 implements a protected doctor visits API. Every request uses the current user from the JWT access token. The API never accepts `userId` from the request body.

Visit API fields:

- `title`: required
- `specialist`: optional doctor or specialist name
- `date`: required, `YYYY-MM-DD`
- `time`: optional, `HH:mm`
- `location`: optional clinic, cabinet, or place
- `notes`: optional text
- `preparationNotes`: optional preparation notes
- `status`: `PLANNED`, `COMPLETED`, `CANCELLED`; default is `PLANNED`

Internally, `date` and `time` are stored as one `visitDate`. API responses split them back into `date` and `time`.

### Create Visit

```powershell
$body = @{
  title = "Плановый приём"
  specialist = "Акушер-гинеколог"
  date = "2026-07-15"
  time = "10:30"
  location = "Женская консультация, кабинет 12"
  notes = "Взять обменную карту"
  preparationNotes = "Подготовить вопросы врачу"
  status = "PLANNED"
} | ConvertTo-Json

$createdVisit = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/visits" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $body

$visitId = $createdVisit.visit.id
```

Expected response shape:

```json
{
  "visit": {
    "id": "uuid",
    "title": "Плановый приём",
    "specialist": "Акушер-гинеколог",
    "date": "2026-07-15",
    "time": "10:30",
    "location": "Женская консультация, кабинет 12",
    "notes": "Взять обменную карту",
    "preparationNotes": "Подготовить вопросы врачу",
    "status": "PLANNED",
    "createdAt": "2026-07-05T00:00:00.000Z",
    "updatedAt": "2026-07-05T00:00:00.000Z"
  }
}
```

### List Visits

Returns current user's visits sorted from nearest to later by date and time.

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/visits" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Upcoming Visits

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/visits/upcoming" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Get One Visit

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/visits/$visitId" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Update Visit

```powershell
$body = @{
  time = "11:00"
  location = "Перинатальный центр, кабинет 8"
  notes = "Приём перенесли на 11:00"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/visits/$visitId" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

### Delete Visit

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:3000/visits/$visitId" `
  -Headers @{ Authorization = "Bearer $token" }
```

Errors:

- `400` for invalid DTO input
- `401` for missing or invalid JWT
- `404` when the visit does not exist or belongs to another user

## Doctor Questions

MOM-21 implements a protected doctor questions API. Every request uses the current user from the JWT access token. The API never accepts `userId` from the request body.

Doctor question API fields:

- `question`: required
- `answer`: optional doctor answer
- `status`: `NEW`, `ANSWERED`, `ARCHIVED`; default is `NEW`
- `visitId`: optional visit id when a question is linked to a specific visit

If `visitId` is provided, the backend checks that the visit belongs to the current user.

### Create Doctor Question

```powershell
$body = @{
  question = "Можно ли продолжать лёгкие тренировки?"
  visitId = $visitId
} | ConvertTo-Json

$createdQuestion = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/doctor-questions" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $body

$questionId = $createdQuestion.question.id
```

Expected response shape:

```json
{
  "question": {
    "id": "uuid",
    "question": "Можно ли продолжать лёгкие тренировки?",
    "answer": null,
    "status": "NEW",
    "visitId": "visit-uuid",
    "createdAt": "2026-07-06T00:00:00.000Z",
    "updatedAt": "2026-07-06T00:00:00.000Z"
  }
}
```

### List Doctor Questions

Returns current user's questions sorted from newest to oldest.

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/doctor-questions" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Get One Doctor Question

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/doctor-questions/$questionId" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Save Doctor Answer

```powershell
$body = @{
  answer = "Можно, если нет противопоказаний. Уточнить нагрузку на приёме."
  status = "ANSWERED"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/doctor-questions/$questionId" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

### Archive Doctor Question

```powershell
$body = @{
  status = "ARCHIVED"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/doctor-questions/$questionId" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### Delete Doctor Question

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:3000/doctor-questions/$questionId" `
  -Headers @{ Authorization = "Bearer $token" }
```

Errors:

- `400` for invalid DTO input
- `401` for missing or invalid JWT
- `404` when the question does not exist, or when `visitId` does not belong to the current user

## Content, Pregnancy Weeks, Checklists, Articles

MOM-25 adds read-only pregnancy week content, weekly checklists with per-user progress, and public articles.

Run seed data after migrations:

```powershell
cd C:\work\momcare\backend
npm run seed
```

The seed populates:

- pregnancy week content for all weeks `1`–`42` (from `prisma/info_of_weeks.json`);
- weekly checklist items for every week `1`–`42` (at least two useful items per week);
- several neutral informational articles.

All checklist content is informational and does not replace consultation with a doctor. Medical actions are phrased as recommendations to discuss with a doctor (`обсудить с врачом`, `уточнить у врача`, `если врач рекомендовал`); the seed does not include drug prescriptions, diagnoses, or mandatory medical procedures.

The seed is idempotent: re-running `npm run seed` updates existing items by `week + title` and does not create duplicates.

### Pregnancy Week Content

This endpoint is public because it returns reference content only.

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/pregnancy-weeks/27"
```

Expected response shape:

```json
{
  "content": {
    "id": "uuid",
    "week": 27,
    "title": "27 неделя беременности",
    "babyDevelopment": "...",
    "motherChanges": "...",
    "recommendation": "...",
    "babySize": "...",
    "babyWeight": "...",
    "babyLength": "...",
    "createdAt": "2026-07-06T00:00:00.000Z",
    "updatedAt": "2026-07-06T00:00:00.000Z"
  }
}
```

### Daily Tip of the Day

`GET /pregnancy-weeks/current/daily-tip` returns one neutral "совет дня" (tip of the day) for the user's pregnancy week. The endpoint is protected by the JWT guard. Tips are not stored in the database: they live in `prisma/info_of_weeks.json` as a `dailyTips` array per supported week (`1..42`, at least 7 tips each).

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/pregnancy-weeks/current/daily-tip?date=2026-10-11" `
  -Headers @{ Authorization = "Bearer $token" }
```

The `date` query parameter is optional and must be the user's local calendar date in `YYYY-MM-DD` format. When omitted, the backend uses the current UTC calendar day. An invalid or missing-in-format `date` returns `400`.

Expected response shape when the week is known:

```json
{
  "date": "2026-10-11",
  "pregnancyWeek": 24,
  "title": "Спокойный отдых",
  "text": "Найдите сегодня время для спокойного отдыха и комфортного режима сна.",
  "isGeneral": false
}
```

How the week and the tip are chosen:

- the pregnancy week is calculated from the user's profile for the given date (from the last menstrual period when present, otherwise from the due date);
- the same profile week + date always returns the same tip (deterministic selection, no randomness);
- neighboring dates move to the next tip in the week's list, so tips do not repeat on consecutive days;
- tips are informational and neutral: no diagnoses, prescriptions, or promised medical results.

When the profile is missing or the term cannot be resolved to a supported week (`1..42`), the endpoint returns `200` with a safe general tip instead of an error:

```json
{
  "date": "2026-10-11",
  "pregnancyWeek": null,
  "title": "Спокойный ритм дня",
  "text": "Уделите сегодня немного времени отдыху и наблюдайте за самочувствием. При появлении вопросов о здоровье обсудите их с врачом.",
  "isGeneral": true
}
```

`isGeneral: true` marks the fallback: clients can rely on the general tip when they do not need to know the exact week.

Errors:

- `400` for an invalid or non-`YYYY-MM-DD` `date` query parameter
- `401` for missing or invalid JWT

### Weekly Checklists

Checklist content is shared, but completion progress is stored per user in `UserChecklistProgress`, so each user's toggles never mix with another user's.

Get the checklist for a given pregnancy week:

```powershell
# Valid weeks: 1..42. Any other value returns 400.
$checklist = Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/checklists?week=27" `
  -Headers @{ Authorization = "Bearer $token" }

$checklistItemId = $checklist.items[0].id
```

Expected response shape (`items` is sorted by `sortOrder`):

```json
{
  "items": [
    {
      "id": "uuid",
      "week": 27,
      "title": "Проверить список анализов",
      "description": "Сверьте с назначениями врача, какие анализы нужны перед визитом.",
      "category": "HEALTH",
      "sortOrder": 1,
      "isDefault": true,
      "isCompleted": false,
      "createdAt": "2026-07-06T00:00:00.000Z",
      "updatedAt": "2026-07-06T00:00:00.000Z"
    }
  ]
}
```

`category` is one of `DOCUMENTS`, `HEALTH`, `DOCTOR`, `HOSPITAL_BAG`, `BABY`, `OTHER`.

Toggle the current user's completion state for a checklist item:

```powershell
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/checklists/$checklistItemId/toggle" `
  -Headers @{ Authorization = "Bearer $token" }
```

The response is the updated item with the new `isCompleted` value. Calling toggle again restores the previous state. Toggling an item for one user does not affect other users.

Checklist item shape:

```json
{
  "item": {
    "id": "uuid",
    "week": 27,
    "title": "Проверить список анализов",
    "description": "Сверьте с назначениями врача, какие анализы нужны перед визитом.",
    "category": "HEALTH",
    "sortOrder": 1,
    "isDefault": true,
    "isCompleted": true,
    "createdAt": "2026-07-06T00:00:00.000Z",
    "updatedAt": "2026-07-06T00:00:00.000Z"
  }
}
```

Errors:

- `400` for a missing or non-integer `week`, or a `week` outside `1..42`
- `401` for missing or invalid JWT on checklist endpoints
- `404` when the checklist item does not exist

### Articles

Article list is public and supports optional filters:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/articles"

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/articles?category=DOCTOR&pregnancyWeek=27"
```

Get one article:

```powershell
$articles = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/articles"
$articleId = $articles.articles[0].id

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/articles/$articleId"
```

Errors:

- `400` for invalid filter values
- `404` when the article is not found

## Current Scope

Implemented now:

- TypeScript Express application structure
- PostgreSQL Docker Compose setup
- Prisma schema and initial migration
- Health endpoint
- Basic auth endpoints: register, login, me
- JWT guard for protected endpoints
- User service that does not expose `passwordHash`
- Pregnancy profile endpoints: get, create, update
- Diary endpoints: list, get one, create, update, delete; each entry supports several `moods` (the legacy single `mood` remains accepted on input and returned in responses)
- Visit endpoints: list, upcoming, get one, create, update, delete
- Doctor question endpoints: list, get one, create, update, delete
- Pregnancy week content endpoint
- Daily tip (совет дня) endpoint `GET /pregnancy-weeks/current/daily-tip` with deterministic tips for weeks `1..42` from `prisma/info_of_weeks.json`
- Weekly checklist endpoints with per-user progress
- Article list and detail endpoints

Not implemented in this task:

- Refresh token flow
- Mobile integration
- PDF reports
- Push notifications
- Medical recommendations or diagnosis logic
