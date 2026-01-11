# Campus Compass - Local Setup Guide

## Prerequisites

- **Docker & Docker Compose** installed
- **Go 1.24.4** or higher
- **Node.js 18+** and **npm**
- **Git** (for version control)

### Install Docker (if not already installed)

```bash
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## Architecture Overview

The application runs on **3 separate services**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Local Machine                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Terminal 1          Terminal 2          Terminal 3         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │Docker Compose│   │ Go Backend   │   │ Next.js      │   │
│  │              │   │              │   │ Frontend     │   │
│  │ PostgreSQL   │   │ 4 Services   │   │              │   │
│  │ :5432        │   │ :8080-8083   │   │ :3000        │   │
│  │              │   │              │   │              │   │
│  │ RabbitMQ     │   │ ✅ Auth      │   │ Browser      │   │
│  │ :5672        │   │ ✅ Maps      │   │ localhost:   │   │
│  │              │   │ ✅ Assets    │   │ 3000         │   │
│  │ ✅ Running   │   │ ✅ Search    │   │              │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
cd /home/unsaid/Documents/compass
```

(You already have this, so skip if done)

---

### Step 2: Configure Backend Secrets

#### 2a. Create `secret.yml` from template

```bash
cd /home/unsaid/Documents/compass/server
cp secret.yml.template secret.yml
```

#### 2b. Edit `secret.yml` with your credentials

```bash
nano secret.yml  # or use your preferred editor
```

Fill in the required fields:

```yaml
database:
  password: "postgres"  # Must match docker-compose.yml

rabbitmq:
  password: "guest"     # Default for development

jwt:
  secret: "dev-secret-key-12345"  # Any random string for dev

smtp:
  user: your-email@gmail.com
  pass: "your-app-password"  # Generate from Google Account Settings
  # Steps for Gmail app password:
  # 1. Go to https://myaccount.google.com/security
  # 2. Enable 2-Factor Authentication
  # 3. Go to App passwords
  # 4. Select Mail and Linux/Mac
  # 5. Copy the 16-character password

openai:
  moderation: "sk-xxxxx"  # Optional - Get from OpenAI API

recaptcha:
  key: "6Lecl_UrAAAAAFrl5dsQ9WG38vlxUGvL51MpvLWY"  # Your reCAPTCHA secret key

oa:
  url: "https://oag.iitk.ac.in/digital-studverify/checkstudent"
  key: "308b6a37-ac4b-8803-ad48-f8901e71fcfe"

automation:
  url: "http://localhost:8084"
  key: "aaaabbbb-bbbb-1111-ac12-aabbccddeeff"
```

**Note:** For development, you can use placeholder values for `openai`, `recaptcha`, `oa`, and `automation` unless you're specifically testing those features.

---

### Step 3: Configure Frontend Environment

#### 3a. Create `.env.local` in the root directory

```bash
cd /home/unsaid/Documents/compass
cat > .env.local << 'EOF'
NEXT_PUBLIC_AUTH_URL=http://localhost:8080
NEXT_PUBLIC_MAPS_URL=http://localhost:8081
NEXT_PUBLIC_ASSETS_URL=http://localhost:8082
NEXT_PUBLIC_SEARCH_URL=http://localhost:8083
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
NEXT_PUBLIC_PROFILE_URL=/
EOF
```

**Note:** The reCAPTCHA site key above is Google's **test key**. For production, use your own keys from [Google reCAPTCHA](https://www.google.com/recaptcha/admin).

---

## Running the Application

You need **3 terminal windows** running simultaneously. Here's how:

### Terminal 1: Start Docker Services (PostgreSQL + RabbitMQ)

```bash
cd /home/unsaid/Documents/compass/server
docker-compose up postgres rabbitmq
```

Expected output:
```
postgres-1   | database system is ready to accept connections
rabbitmq-1   | Server startup complete
```

**Keep this terminal running.** Don't press Ctrl+C.

---

### Terminal 2: Start Go Backend

Open a new terminal and run:

```bash
cd /home/unsaid/Documents/compass/server
go mod tidy
go build -o server ./cmd/.
./server
```

Expected output:
```
INFO[2026-01-11 17:18:12] rabbitmq.go:58 Set up done for rabbitmq...
INFO[2026-01-11 17:18:12] db.go:49 Connected to database
INFO[2026-01-11 17:18:12] main.go:40 Main server is Starting...
INFO[2026-01-11 17:18:12] cleanup.go:13 Cleanup worker is up and running...
INFO[2026-01-11 17:18:12] mail.go:16 Mailing worker is up and running...
INFO[2026-01-11 17:18:12] moderator.go:17 Moderator worker is up and running...
```

Backend is now running on:
- **Auth Server:** http://localhost:8080
- **Maps Server:** http://localhost:8081
- **Assets Server:** http://localhost:8082
- **Search Server:** http://localhost:8083

**Keep this terminal running.** Don't press Ctrl+C.

---

### Terminal 3: Start Next.js Frontend

Open a third terminal and run:

```bash
cd /home/unsaid/Documents/compass
npm install
npm run dev
```

Expected output:
```
> next dev --turbopack
▲ Next.js 15.5.9
  ▲ Local: http://localhost:3000
```

**Frontend is now running at:** http://localhost:3000

---

## Accessing the Application

Open your browser and visit:

```
http://localhost:3000
```

You should see the Campus Compass website!

---

## Stopping the Application

### To stop all services gracefully:

**Terminal 1 (Docker):**
```bash
Ctrl+C
docker-compose down
```

**Terminal 2 (Backend):**
```bash
Ctrl+C
```

**Terminal 3 (Frontend):**
```bash
Ctrl+C
```

---

## Troubleshooting

### Docker daemon not running
```bash
sudo systemctl start docker
```

### Port already in use
If port 5432, 5672, 8080-8083, or 3000 are already in use, you need to either:
1. Stop the service using that port
2. Change the port in the relevant config file

**For Docker services**, edit `server/docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Changed from 5432 to 5433
```
Then update `server/config.yaml` to match.

### Backend can't connect to database
- Ensure Docker containers are running: `docker ps`
- Check Docker logs: `docker-compose logs postgres`
- Verify `secret.yml` has correct database password

### Frontend shows CORS errors
- Ensure backend is running (Terminal 2)
- Check `.env.local` has correct API URLs (http://localhost:8080, etc.)
- Refresh the browser

### VIPS warning about OpenSlide
```
WARNING **: unable to load "...vips-openslide.so"
```
This is non-critical and can be ignored. If you want to fix it:
```bash
sudo pacman -S libopenslide
```

### "Build failed" or other Go errors
```bash
cd /home/unsaid/Documents/compass/server
go clean
go mod tidy
go build -o server ./cmd/.
./server
```

---

## Environment Variables Reference

### Backend (`secret.yml`)
| Variable | Purpose | Required? |
|----------|---------|-----------|
| `database.password` | PostgreSQL password | ✅ Yes |
| `rabbitmq.password` | RabbitMQ password | ✅ Yes |
| `jwt.secret` | JWT signing key | ✅ Yes |
| `smtp.user` | Gmail account for sending emails | ✅ Yes |
| `smtp.pass` | Gmail app password | ✅ Yes |
| `openai.moderation` | OpenAI API key for content moderation | ❌ Optional |
| `recaptcha.key` | reCAPTCHA secret key | ❌ Optional (dev) |

### Frontend (`.env.local`)
| Variable | Purpose | Value |
|----------|---------|-------|
| `NEXT_PUBLIC_AUTH_URL` | Backend Auth service | `http://localhost:8080` |
| `NEXT_PUBLIC_MAPS_URL` | Backend Maps service | `http://localhost:8081` |
| `NEXT_PUBLIC_ASSETS_URL` | Backend Assets service | `http://localhost:8082` |
| `NEXT_PUBLIC_SEARCH_URL` | Backend Search service | `http://localhost:8083` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | Test key provided |

---

## Architecture Details

### Backend Services

The Go backend runs 4 independent microservices + 3 background workers:

**HTTP Services:**
- **Auth (8080):** Login, signup, profile management, email verification
- **Maps (8081):** Location data, map operations, noticeboard
- **Assets (8082):** Image upload, processing, serving
- **Search (8083):** Search functionality

**Background Workers:**
- **MailingWorker:** Processes email queue from RabbitMQ
- **ModeratorWorker:** Checks content with OpenAI API
- **CleanupWorker:** Removes old temporary files

### Frontend Stack

- **Next.js 15:** React framework with server-side rendering
- **TypeScript:** Type-safe development
- **Tailwind CSS:** Utility-first CSS framework
- **Shadcn/ui:** Component library
- **SWR:** Data fetching library
- **MapLibre GL:** Map rendering

### Database & Queue

- **PostgreSQL 15:** Main database (running in Docker)
- **RabbitMQ 3:** Message queue for async tasks (running in Docker)

---

## Development Tips

### Hot Reload
- **Frontend:** Changes automatically reload (Next.js dev server)
- **Backend:** Need to rebuild and restart after changes:
  ```bash
  go build -o server ./cmd/.
  ./server
  ```

### Debugging Backend
```bash
# Run with debug logging
LOG_LEVEL=debug ./server
```

### Debugging Frontend
- Open browser DevTools (F12)
- Check Console and Network tabs
- Use React DevTools extension

### Testing APIs
```bash
# Test Auth endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@iitk.ac.in","password":"test"}'
```

---

## Common Tasks

### Reset Database
```bash
# Stop Docker
docker-compose down

# Start fresh (deletes all data)
docker-compose up postgres rabbitmq
```

### View Database Directly
```bash
docker exec -it postgres psql -U this_is_mjk -d compass
```

### View RabbitMQ Admin Panel
```
http://localhost:15672
Username: guest
Password: guest
```

### Rebuild Frontend
```bash
cd /home/unsaid/Documents/compass
npm run build
npm start
```

---

## Next Steps

1. ✅ Start all 3 terminals
2. ✅ Visit http://localhost:3000
3. ✅ Try logging in or signing up
4. ✅ Explore the application
5. ✅ Check browser console for any errors

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the terminal output for error messages
3. Ensure all 3 services are running
4. Check that all required credentials are filled in `secret.yml`

---

## License

This project is part of the Programming Club, IIT Kanpur.
