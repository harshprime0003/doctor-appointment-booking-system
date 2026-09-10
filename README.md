# MediBook — Doctor Appointment Booking System (MERN)

A production-style doctor appointment booking and clinic management application built
on the MERN stack. It ships with a **pluggable storage layer**: it runs on a zero-setup
**file-based database** out of the box, and can switch to **MongoDB / MongoDB Atlas**
by flipping a single environment flag.

The UI is designed as an enterprise/internal tool (think Stripe Dashboard, Linear,
Shopify Admin): flat, bordered, dense, table-driven — not a marketing landing page.

---

## Features

**Four roles, each with a dedicated workspace**

- **Patient** — smart doctor search (name, disease, specialty, city, gender,
  language, insurance, fee, rating), AI symptom checker, AI doctor recommendation,
  pay-first booking, emergency appointments, live status tracking, prescriptions,
  and an EHR vault for reports.
- **Doctor** — dashboard, appointment management, **live queue/token board**,
  weekly availability + breaks + holiday/vacation blocking, leave requests,
  write & sign digital prescriptions, profile photo upload, patient list.
- **Receptionist** — front-desk queue management (check-in → call → consult →
  complete), all appointments, and doctor leave approvals.
- **Admin** — clinic-wide dashboard, approve doctors, manage users & receptionists,
  multi-branch management, and a full audit log.

**Flagship features**

- ⭐ **AI Symptom Checker** — rule-based triage engine that maps symptoms to likely
  conditions, a recommended specialist, urgency level and home-care advice.
- ⭐ **AI Doctor Recommendation** — scores doctors by rating, experience, success
  rate, budget, language, location and your visit history.
- **Live Queue + Token board** — "Now Serving" display, per-patient token numbers,
  estimated wait times, auto-refresh.
- **Real-time appointment tracking** — Booked → Checked-in → Called → In
  Consultation → Completed.
- **Payments (dummy Razorpay-style)** — pay before booking (UPI / card / net
  banking / wallet) with a **GST tax invoice** you can print or save as PDF.
- **Emergency appointments** — priority booking with a surcharge.
- **Prescriptions** — doctors write & sign; patients view/print as PDF.
- **EHR** — upload lab reports, X-Ray, MRI, CT, vaccination records (PDF/image).
- **Dynamic scheduling** — working hours, lunch/breaks, holidays, vacation and
  approved leaves all shape available slots automatically.
- **Admin controls** — approve/edit doctors, manage users & receptionists, a
  **Payments & Revenue** ledger (with GST), audit logs, and analytics.
- **Multilingual (English / हिंदी)** with an in-app language switcher.

**Platform**

- JWT authentication with role-based authorization.
- Real-time slot generation with double-booking prevention.
- Server-side filtering, search, sorting and pagination on every list.
- File uploads (avatars + EHR) via multer.
- Request validation (zod), rate limiting, `helmet`, CORS.
- Fully responsive, colorful enterprise UI (sidebar collapses on mobile).

---

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React 18, React Router, Vite, Axios, plain CSS DS |
| Backend   | Node.js, Express, JWT, bcryptjs, zod              |
| Database  | File-based JSON store **or** MongoDB (via flag)   |

---

## Project structure

```
doctor-appointment-booking-system/
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # env config
│   │   ├── db/             # pluggable storage layer
│   │   │   ├── adapters/   # fileAdapter.js + mongoAdapter.js
│   │   │   ├── query.js    # mongo-like query engine (file adapter)
│   │   │   └── index.js    # driver selection
│   │   ├── repositories/   # domain data access
│   │   ├── controllers/    # route handlers
│   │   ├── routes/         # express routers
│   │   ├── middleware/     # auth + error handling
│   │   ├── utils/          # auth, slots, validators, etc.
│   │   ├── seed.js         # demo data
│   │   ├── app.js
│   │   └── server.js
│   └── data/               # file DB storage (git-ignored)
├── client/                 # React app (Vite)
│   └── src/
│       ├── api/            # axios client + endpoints
│       ├── components/     # layout + reusable UI
│       ├── context/        # auth + toast
│       ├── pages/          # screens
│       └── styles/         # design system
└── package.json            # root scripts (concurrently)
```

---

## 🚀 Run it (4 steps)

You need **Node.js 18+** installed. Then, from the project folder:

```bash
npm run install:all      # 1. install everything
cp server/.env.example server/.env   # 2. create config (Windows: copy server\.env.example server\.env)
npm run seed             # 3. add demo data
npm run dev              # 4. start it
```

Now open the URL Vite prints (usually **http://localhost:5173**). Done! 🎉

> Defaults need no editing (file-based DB, API on port 4800). If a port is busy, it auto-picks the next one.

### Demo logins

Same password for all: **`Password123`**

| Role         | Email                          |
| ------------ | ------------------------------ |
| Admin        | `admin@clinic.test`            |
| Receptionist | `reception@clinic.test`        |
| Doctor       | `kavita.deshpande@clinic.test` |
| Patient      | `isha.verma@example.test`      |

---

## Switching to cloud MongoDB

The storage layer is fully abstracted — no controller code changes are needed.
Edit `server/.env`:

```env
DB_DRIVER=mongo
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=doctor_appointments
```

Then re-seed and start:

```bash
npm run seed
npm run dev
```

- `DB_DRIVER=file` → local JSON files in `server/data/` (default, zero setup).
- `DB_DRIVER=mongo` → MongoDB / Atlas using the connection string above.

Both drivers expose the exact same repository interface (`create`, `find`, `findOne`,
`updateById`, `deleteMany`, …) and accept the same MongoDB-style query objects, so the
application behaves identically on either backend.

---

## Available scripts (root)

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run install:all` | Install root, server and client deps         |
| `npm run seed`        | Seed the database with demo data             |
| `npm run dev`         | Run API + client concurrently                |
| `npm run dev:server`  | Run API only                                 |
| `npm run dev:client`  | Run client only                              |
| `npm run build`       | Build the client for production              |
| `npm start`           | Start the API in production mode             |

---

## Production notes

- Set a strong `JWT_SECRET` and `NODE_ENV=production`.
- Build the client (`npm run build`) and serve `client/dist` from your CDN/host;
  point it at the API origin (configure `CLIENT_ORIGIN` on the server for CORS).
- Use `DB_DRIVER=mongo` with a managed MongoDB for durability and scaling.

---

## API overview

| Method | Endpoint                        | Access        |
| ------ | ------------------------------- | ------------- |
| POST   | `/api/auth/register`            | Public        |
| POST   | `/api/auth/login`               | Public        |
| GET    | `/api/auth/me`                  | Authenticated |
| GET    | `/api/doctors`                  | Public        |
| GET    | `/api/doctors/:id`              | Public        |
| GET    | `/api/doctors/:id/slots?date=`  | Public        |
| GET    | `/api/appointments`             | Role-scoped   |
| POST   | `/api/appointments`             | Patient       |
| PATCH  | `/api/appointments/:id/status`  | Role-scoped   |
| POST   | `/api/reviews`                  | Patient       |
| GET    | `/api/admin/stats`              | Admin         |
| GET    | `/api/admin/users`              | Admin         |
| GET    | `/api/admin/doctors`            | Admin         |

