# 🎯 JobTrackr Pro

> A full-stack, self-hosted job application tracking platform built for serious job seekers. Manage your entire pipeline from planning to offer, visualize progress in Kanban and List views, and stay on top of your system health with a built-in Prometheus/Grafana monitoring stack.

---

## 📸 Overview

JobTrackr Pro gives you a centralized dashboard to track every job application across its full lifecycle — from "Planned" to "Offer" or "Rejected". Built with a clean dark UI, it keeps everything organized, searchable, and filterable in real time.

### 🖼️ Preview

<p align="center">
  <img src="assets/screenshots/dashboard.png" alt="JobTrackr Pro Dashboard" width="800">
  <br>
  <em>Main Dashboard — Real-time KPIs and application overview</em>
  <br><br>
  <img src="assets/screenshots/login.png" alt="JobTrackr Pro Login" width="800">
  <br>
  <em>Sleek Login Experience</em>
</p>

---


### ✨ Key Features

- **Full Application Pipeline** — Track status across 8 stages: Planned, Applied, Screening, Technical, Interview, Offer, Rejected, Withdrawn
- **Dual View** — Switch between Kanban board and sortable List view
- **Advanced Filters** — Filter by status, application method, city, and full-text search
- **Analytics Dashboard** — Visual pipeline breakdown with success rate KPIs
- **Import / Export** — Bulk import via JSON, export to CSV
- **Authentication** — Secure JWT-based auth with refresh tokens
- **Full Monitoring Stack** — Built-in Prometheus & Grafana dashboards for system health
- **Self-Hosted** — Full Docker Compose setup for production deployment with automated CI/CD

---

## 🏗️ Architecture

```
├── api/            # Express.js REST API (Node.js)
├── web/            # Next.js 15 Frontend (App Router)
├── nginx/          # Reverse Proxy configuration
├── scripts/        # Backup & Restore automation
├── docker-compose.yml        # Base + Development stack
├── docker-compose.prod.yml   # Production overrides
└── .env.example    # Environment variable template
```

### Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | Next.js 15, TypeScript, Tailwind CSS    |
| Backend      | Node.js, Express.js                     |
| Database     | MongoDB 7 + Mongoose                    |
| Auth         | JWT (access + refresh tokens)           |
| State        | Zustand                                 |
| API Layer    | TanStack Query (React Query)            |
| Validation   | Joi (API), Zod (Frontend)               |
| Reverse Proxy| Nginx (rate limiting + security headers)|
| Containers   | Docker, Docker Compose                  |
| CI/CD        | GitHub Actions (Self-Hosted Runner)     |
| Backups      | Shell scripts + rclone → Google Drive   |

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 20+](https://nodejs.org/) (for local development only)
- [Git](https://git-scm.com/)

---

## ⚙️ Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/AymanElh/job-tracker.git
cd job-tracker
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Then fill in the values in `.env`:

```env
# ── MongoDB ────────────────────────────────────────
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=your_strong_password_here
MONGO_APP_USER=jobtrackr_app
MONGO_APP_PASS=your_app_password_here
MONGO_URI=mongodb://jobtrackr_app:your_app_password@mongo:27017/jobtrackr

# ── Mongo Express (DB Admin UI) ────────────────────
ME_USER=dev
ME_PASS=dev_password

# ── Express API ────────────────────────────────────
NODE_ENV=development
PORT=5000
JWT_SECRET=generate_with_openssl_rand_base64_64
JWT_REFRESH_SECRET=generate_with_openssl_rand_base64_64
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Next.js ────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost/api/v1
```

> **Generate strong secrets with:**
> ```bash
> openssl rand -base64 64
> ```
> Copy the output as a single line (remove any line breaks).

---

## 🐳 Running with Docker

### Development (with DB admin UI)

```bash
docker compose -f docker-compose.yml up -d
```

| Service       | URL                        |
|---------------|----------------------------|
| Frontend      | http://localhost            |
| API           | http://localhost/api/v1     |
| Mongo Express | http://localhost:8081       |

### Production

Create a `.env.prod` from the example and fill in production secrets:

```bash
cp .env.example .env.prod
```

Then launch the production stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 💻 Local Development (without Docker)

### API

```bash
cd api
npm install
npm run dev
```

API runs at: `http://localhost:5000`

### Web

```bash
cd web
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

> Make sure you have a MongoDB instance running locally or update `MONGO_URI` to point to your DB.

---

## 📦 Database Backup & Restore

Automated backup scripts are provided in the `scripts/` directory.

### Manual Backup

```bash
./scripts/backup.sh
```

Backups are saved to `~/jobtrackr-backups/` and automatically uploaded to Google Drive via `rclone`.

### Restore from latest local backup

```bash
./scripts/restore.sh
```

### Restore from Google Drive

```bash
./scripts/restore.sh --from-drive
```

### Automated Daily Backup (Cron)

Add to your crontab with `crontab -e`:

```bash
0 17 * * * /home/ayman/FeaturedProjects/JobSearch/scripts/backup.sh >> ~/jobtrackr-backups/cron.log 2>&1
```

---

## 📁 Project Structure

```
api/
├── src/
│   ├── config/         # DB connection, logger, mongo-init
│   ├── modules/
│   │   ├── applications/   # Job applications CRUD
│   │   ├── auth/           # Registration, Login, JWT
│   │   └── contacts/       # Contact management
│   ├── app.js
│   └── server.js
└── Dockerfile

web/
├── app/
│   ├── (auth)/         # Login / Register pages
│   └── (dashboard)/    # Protected pages
│       ├── page.tsx        # Home dashboard
│       ├── applications/   # Applications workspace
│       ├── analytics/      # Analytics hub
│       └── settings/       # Profile & password
├── components/
│   ├── applications/   # Kanban, List, Sheets
│   ├── layout/         # Sidebar, TopBar
│   └── ui/             # shadcn/ui components
├── lib/                # API client (axios)
├── store/              # Zustand stores
└── Dockerfile

scripts/
├── backup.sh           # MongoDB dump + compression + GDrive upload
└── restore.sh          # Restore from local or GDrive backup

nginx/
└── nginx.conf          # Reverse proxy + rate limiting + security headers
```

---

## 📊 Monitoring & Observability

JobTrackr Pro comes with a pre-configured monitoring stack based on **Prometheus** and **Grafana**. It tracks system-level metrics, container health, and API performance.

### 📈 Grafana Dashboards

The monitoring stack includes two primary dashboards:
- **Node Exporter Full** — Detailed host system metrics (CPU, Memory, Disk, Network).
- **Docker Monitoring** — Per-container resource usage and performance.

<p align="center">
  <img src="assets/screenshots/grafana_node.png" alt="Grafana Node Exporter" width="45%">
  <img src="assets/screenshots/grafana_docker.png" alt="Grafana Docker Monitoring" width="45%">
</p>

### 🛠️ Accessing Monitoring
- **Grafana:** `http://localhost:3001` (Default credentials in `.env.prod`)
- **Prometheus:** `http://localhost:9090`
- **API Metrics:** `http://localhost/api/v1/metrics`

---

## 🔒 Security

- All containers run as **non-root users** (`nodeuser`, `nextuser`)
- MongoDB is only accessible via `127.0.0.1` (not publicly exposed)
- Nginx adds `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` headers
- API rate limiting enabled via Nginx (`limit_req_zone`)
- NoSQL injection protection enabled on the API layer
- JWT tokens are short-lived (15 minutes) with refresh token rotation

---

## 🌿 Branching Strategy

| Branch    | Purpose                                      |
|-----------|----------------------------------------------|
| `main`    | Production-ready code — mirrors live server  |
| `staging` | Pre-production validation                    |
| `dev`     | Active development integration               |

---

## 📄 License

This project is for personal portfolio and learning purposes.

---

<p align="center">Built with ☕ and way too many Docker logs</p>
