# Repository Structure Explanation

## Quick Answer
**The backend for BOTH search and compass is in the `/server` folder (single Go application).**

---

## Architecture Overview

```
Your Repository
│
├── /server (BACKEND - Single Go Application)
│   ├── cmd/
│   │   ├── main.go           ← Starts multiple servers
│   │   ├── search.go         ← Search API endpoints
│   │   ├── maps.go           ← Maps/Compass API endpoints
│   │   ├── auth.go           ← Authentication API
│   │   └── assets.go         ← Asset upload/management API
│   ├── docker-compose.yml    ← Docker setup (Backend + PostgreSQL + RabbitMQ)
│   └── Dockerfile            ← Containerizes the Go backend
│
├── /search (FRONTEND - Next.js App)
│   ├── src/                  ← React components for search UI
│   ├── package.json
│   ├── Dockerfile            ← Containerizes the search frontend
│   └── next.config.js
│
├── /app (FRONTEND - Next.js App for Compass)
│   ├── (maps)/               ← Map/location pages
│   ├── (auth)/               ← Auth pages (login, signup)
│   ├── admin/                ← Admin dashboard
│   ├── package.json
│   └── Other Next.js config
│
└── /components (Shared UI components)
```

---

## What Each Piece Does

### Backend `/server`
**Single Go application** that runs MULTIPLE servers on different ports:

```go
// From main.go - all these run concurrently
g.Go(func() error { return assetServer().ListenAndServe() })   // Port 8082
g.Go(func() error { return authServer().ListenAndServe() })    // Port 8083
g.Go(func() error { return mapsServer().ListenAndServe() })    // Port 8080
g.Go(func() error { return searchServer().ListenAndServe() })  // Port 8081
```

The backend serves **both**:
- **Search API** - endpoints for the `/search` frontend
- **Maps/Compass API** - endpoints for the `/app` frontend
- **Auth API** - authentication for all frontends
- **Assets API** - image/file uploads for all apps

### Frontend: `/search`
- **Next.js application** (React)
- **Frontend ONLY** - just the UI
- Calls the backend `/server` on port 8081 (searchServer)
- Will run on port 3000

### Frontend: `/app`
- **Next.js application** (React)
- **Frontend ONLY** - just the UI for compass/maps
- Calls the backend `/server` on ports 8080/8082 (mapsServer, assetServer)
- Will run on port 3001

---

## Data Flow Example

```
User goes to search.pclub
        ↓
Browser loads /search frontend (Next.js on port 3000)
        ↓
Frontend needs student data
        ↓
Sends request to backend API (same /server)
        ↓
Backend's searchServer() processes it (port 8081)
        ↓
Queries PostgreSQL database
        ↓
Returns JSON response to frontend
        ↓
Frontend displays results
```

---

## Deployment Structure

When deployed with Docker Compose:

```
docker-compose.yml
├── Service: postgres
│   ├── Image: postgres:15
│   ├── Port: 5432
│   └── Stores all application data
│
├── Service: rabbitmq
│   ├── Image: rabbitmq:3-management
│   ├── Ports: 5672 (messaging), 15672 (UI)
│   └── Message queue for background jobs
│
└── Service: server
    ├── Image: Built from /server/Dockerfile
    ├── Ports: 8080, 8081, 8082, 8083 (all the API servers)
    ├── Depends on: postgres, rabbitmq
    └── Runs the single Go application
```

---

## Important Points

1. **One Backend, Multiple Frontends**
   - `/server` is ONE Go application with multiple servers running concurrently
   - `/search` and `/app` are separate Next.js frontends
   - Both frontends talk to the SAME backend

2. **Containerization**
   - Backend: Containerized in `/server/Dockerfile`
   - Search frontend: Containerized in `/search/Dockerfile`
   - Compass frontend: Will have its own Dockerfile (in `/app` folder)
   - PostgreSQL & RabbitMQ: Official Docker images

3. **Ports**
   - Backend APIs: 8080-8083 (inside containers, exposed to host)
   - Search Frontend: 3000 (not in docker-compose, run separately for now)
   - Compass Frontend: 3001 (not in docker-compose, run separately for now)
   - Nginx (later): 80 (HTTP), 443 (HTTPS)

---

## What to Containerize First

```
Priority 1 (Already has docker-compose.yml):
✓ /server (Go Backend)
✓ PostgreSQL
✓ RabbitMQ

Priority 2 (Separate, can do later):
- /search frontend (has Dockerfile)
- /app frontend (needs Dockerfile)
- Nginx (needs setup)
```

---

## TL;DR

**Q: Where's the backend?**
A: In `/server` folder. It's a single Go application that serves APIs for both search and compass frontends.

**Q: What's in `/search` then?**
A: Just the UI (Next.js/React). No backend logic.

**Q: What about `/app`?**
A: Also just UI (Next.js/React) for the compass/maps application. Also calls the `/server` backend.

**Q: So they share one backend?**
A: YES. Both frontends send API requests to the same `/server` Go backend, just to different endpoint paths.
