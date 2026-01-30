# Campus Compass - Local Setup Guide

## Prerequisites

- **Docker & Docker Compose** installed
- **Go 1.24.4** or higher
- **Node.js 18+** and **npm**
- **Git** (for version control)

---

## Step-by-Step Setup

### Step 1: Clone the Repository

### Step 2: Configure Backend Secrets

#### 2a. Create `secret.yml` from template

```bash
cd ./compass/server
cp secret.yml.template secret.yml
```
#### 2b. Edit `secret.yml` with your credentials

### Step 3: Configure Frontend Environment

#### 3a. Create `.env.local` in the root directory from `.env.example`

## Running the Application

### Start Docker Services (PostgreSQL + RabbitMQ)

```bash
cd ./compass/server
docker-compose up postgres rabbitmq
```

### Start Go Backend

```bash
cd /compass/server
go mod tidy
go build -o server ./cmd/.
./server
```
---

### Start Next.js Frontend

```bash
cd /compass
npm install
npm run dev
```
repeat this in the /search repository
```bash
cd /compass/search
npm install
npm run dev
```
---


# Credential creation and useful links

1. [Gmail email sending auth token](https://stackoverflow.com/a/27130058/23078987)
2. [For Recaptcha Dev](https://developers.google.com/recaptcha/docs/faq)
3. [For CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

# Subdomain Routing Implementation Guide
## Architecture

### 1. **Next.js Middleware** (`middleware.ts`)
- Intercepts all requests and checks the `X-Subdomain` header set by nginx
- Routes are validated based on the subdomain
- Redirects invalid routes (e.g., accessing auth pages on maps subdomain)

### 2. **Nginx Configuration** (`nginx.conf`)
- Listens on different subdomains
- Sets `X-Subdomain` header to identify the route
- Proxies requests to the same Next.js frontend on port 3001
- All API requests go to port 8081

### 3. **Environment Variables** (`.env.subdomain`)
```env
NEXT_PUBLIC_AUTH_DOMAIN=https://auth.domain.in
NEXT_PUBLIC_MAPS_DOMAIN=https://compass.domain.in
NEXT_PUBLIC_MAIN_DOMAIN=https://domain.in
```

### 4. **Domain Hook** (`app/hooks/useDomainConfig.ts`)
- Helper hook to get current domain based on route
- Provides `currentDomain`, `authDomain`, `mapsDomain`, `mainDomain`
- Detects if you're on an auth or maps route

## Setup Instructions

### Step 1: Update Environment Variables

Add to your `.env.local` or deployment config:

```bash
# For production
NEXT_PUBLIC_AUTH_DOMAIN=https://auth.yourdomain.com
NEXT_PUBLIC_MAPS_DOMAIN=https://compass.yourdomain.com
NEXT_PUBLIC_MAIN_DOMAIN=https://yourdomain.com

# For development/local
NEXT_PUBLIC_AUTH_DOMAIN=http://localhost:3000
NEXT_PUBLIC_MAPS_DOMAIN=http://localhost:3000
NEXT_PUBLIC_MAIN_DOMAIN=http://localhost:3000
```

### Step 2: DNS Configuration

Ensure your DNS provider has records

### Step 3: SSL Certificates

Update the nginx config with your SSL certificate paths:

```nginx
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
```

Or use Let's Encrypt with a wildcard certificate:

```bash
certbot certonly --standalone -d "*.yourdomain.com" -d "yourdomain.com"
```

### Step 4: Restart Services

```bash
# Reload nginx
sudo nginx -s reload

# Rebuild Next.js (if ENV changed)
npm run build
npm start
```

## How It Works

### Request Flow

1. **User visits** `auth.domain.in/login`
2. **Nginx** receives request, identifies `auth` subdomain
3. **Nginx** sets header `X-Subdomain: auth`
4. **Nginx** proxies to `localhost:3001` (Next.js)
5. **Middleware** reads `X-Subdomain` header
6. **Middleware** validates route matches subdomain
7. **Route group** `(auth)` renders login page

### Subdomain Validation Rules

| Subdomain | Allowed Routes | Redirect Target |
|-----------|---|---|
| `auth.domain.in` | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/privacy-policy`, `/profile` | `/login` |
| `compass.domain.in` | `/location/*`, `/noticeboard/*`, `/` | `/` |
| `domain.in` | All routes | N/A |

## Local Development

For local testing without DNS:

1. Update `/etc/hosts` (macOS/Linux):
```
127.0.0.1 localhost
127.0.0.1 auth.localhost
127.0.0.1 compass.localhost
```

2. Set environment variables to `http://localhost:3000`

3. Run Next.js in dev mode:
```bash
npm run dev
```

4. Nginx will handle subdomain routing on your local machine

## Troubleshooting

### Issue: Routes not redirecting correctly

**Solution:** Check that `X-Subdomain` header is being set in nginx config.

```nginx
proxy_set_header X-Subdomain auth;
```

### Issue: CORS errors on cross-domain requests

**Solution:** Configure CORS in your API backend for all subdomain origins:

```go
// Example in Go/Fiber
app.Use(cors.New(cors.Config{
  AllowOrigins: "https://auth.domain.in,https://compass.domain.in,https://domain.in",
  AllowMethods: "GET,POST,PUT,DELETE",
}))
```

### Issue: Cookies not persisting across subdomains

**Solution:** Set cookies with domain attribute in your auth backend:

```go
cookie := &http.Cookie{
  Name:   "auth_token",
  Value:  token,
  Domain: ".domain.in", // Note the leading dot for subdomains
  Path:   "/",
  Secure: true,
  HttpOnly: true,
}
http.SetCookie(w, cookie)
```

## Future Enhancements

1. **Dynamic Domain Loading** - Load domain config from database
2. **Multi-Region Support** - Different subdomains for different regions
3. **Feature Flags** - Toggle subdomain routing on/off
4. **Analytics** - Track which subdomain users access most
