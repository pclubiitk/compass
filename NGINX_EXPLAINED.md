# Nginx Explained - Complete Guide

## What is Nginx?

Nginx is a **reverse proxy** and **web server** that acts as a **traffic director** for your applications. Think of it as a smart receptionist at a hotel:

```
User (Internet)
    ↓
[Nginx - The Receptionist]
"Oh, you want room 101? Go to building A"
"You want room 202? Go to building B"
    ↓
Your Applications (Buildings A, B, C, etc.)
```

---

## Your Current Setup (GCP)

### Before Nginx (What you probably have now)

```
Frontend on 3000 exposed to internet
Internet → Port 3000 (Next.js app)
            ↓
         Shows your UI
         ↓
         Makes API calls to backend

Backend (containerized, running somewhere)
←→ Port 8080, 8081, etc. (Go servers)
```

**Problem**: 
- Users must know the IP address AND port number
- Can't have multiple apps on different ports behind one IP easily
- URLs look ugly: `http://123.45.67.89:3000`

---

## With Nginx (What you need)

```
Internet → Port 80/443 (Nginx listening)
    ↓
[Nginx Decision Making]
"Is this search.pclub?" → Route to port 3000 (search frontend)
"Is this compass.pclub?" → Route to port 3001 (compass frontend)
"Is this api.pclub/search?" → Route to port 8081 (search backend)
"Is this api.pclub/maps?" → Route to port 8080 (maps backend)
    ↓
Your actual applications on localhost ports

Result: Users see clean URLs
search.pclub → Frontend UI
compass.pclub → Frontend UI
```

---

## How Nginx Redirects Subdomains

### Step 1: Domain Points to Your Server

```
Your Domain: pclub.com (on GCP)
DNS Records:
├── A record: pclub.com → 34.56.78.90 (your GCP IP)
├── A record: search.pclub.com → 34.56.78.90 (same IP)
├── A record: compass.pclub.com → 34.56.78.90 (same IP)
└── A record: api.pclub.com → 34.56.78.90 (same IP)

All subdomains point to SAME IP!
```

### Step 2: Nginx Reads the Domain Name

When a user visits `search.pclub.com`:

```
Browser: "GET / HTTP/1.1
          Host: search.pclub.com"
    ↓
Nginx receives request
Nginx reads the "Host" header: "search.pclub.com"
Nginx checks config: "Oh, search.pclub.com? Send to localhost:3000"
    ↓
Request forwarded to port 3000
    ↓
Search frontend on port 3000 responds
Response sent back to user
```

### Step 3: Nginx Config Example

```nginx
# Search subdomain
server {
    listen 80;
    server_name search.pclub.com;
    
    location / {
        proxy_pass http://localhost:3000;  # ← Forward to search frontend
    }
}

# Compass subdomain
server {
    listen 80;
    server_name compass.pclub.com;
    
    location / {
        proxy_pass http://localhost:3001;  # ← Forward to compass frontend
    }
}

# API subdomain
server {
    listen 80;
    server_name api.pclub.com;
    
    location /search {
        proxy_pass http://localhost:8081;  # ← Forward to search backend
    }
    
    location /maps {
        proxy_pass http://localhost:8080;  # ← Forward to maps backend
    }
}
```

---

## Complete Data Flow Example

### Scenario: User searching on search.pclub.com

```
1. USER ACTION
   User types: search.pclub.com in browser

2. DNS LOOKUP
   Browser: "What's the IP for search.pclub.com?"
   DNS: "34.56.78.90" (your GCP server)

3. NGINX RECEIVES REQUEST (Port 80)
   Server at 34.56.78.90 receives HTTP request
   Nginx (listening on port 80) intercepts it
   
4. NGINX READS HOST HEADER
   Request says: "Host: search.pclub.com"
   Nginx checks: "Match found! This goes to port 3000"
   
5. NGINX FORWARDS REQUEST
   Nginx forwards to: http://localhost:3000
   (This is your Next.js search frontend running locally)
   
6. FRONTEND RESPONDS
   Search app at :3000 gets the request
   Returns HTML/CSS/JS (your UI)
   
7. NGINX SENDS BACK TO USER
   Nginx receives response from :3000
   Sends it back to user's browser
   
8. BROWSER RENDERS
   User sees: search.pclub.com with your UI
   
9. USER INTERACTS WITH APP
   User clicks search button
   Frontend JavaScript makes API call:
   fetch('http://api.pclub.com/search?q=student')
   
10. SECOND NGINX REQUEST
    Browser makes request to: api.pclub.com
    Nginx (on same server) receives it
    Nginx config says: "api.pclub.com/search → localhost:8081"
    
11. BACKEND PROCESSES
    Backend at :8081 (searchServer) gets request
    Queries database
    Returns JSON results
    
12. NGINX FORWARDS RESPONSE
    Nginx gets JSON from :8081
    Sends back to user's browser
    
13. FRONTEND UPDATES
    JavaScript receives JSON
    Updates UI with results
    User sees: Results on search.pclub.com ✓
```

---

## Why Nginx is Essential

### Without Nginx:
```
search.pclub.com → 34.56.78.90:3000    (ugly, users don't know the port)
compass.pclub.com → 34.56.78.90:3001   (different port? confusing)
api.pclub.com → 34.56.78.90:8081       (another port?)

Problem: Each app needs a different port exposed
Users must memorize ports: :3000, :3001, :8080, :8081, etc.
```

### With Nginx:
```
search.pclub.com → 34.56.78.90:80 → (Nginx) → localhost:3000
compass.pclub.com → 34.56.78.90:80 → (Nginx) → localhost:3001
api.pclub.com → 34.56.78.90:80 → (Nginx) → localhost:8081

Result: Clean URLs, no ports shown, all go through port 80!
```

---

## Current vs Needed Setup

### Your Current Setup (Exposed on 3000)

```
GCP Server (34.56.78.90)
├── Port 80 (closed/unused)
├── Port 443 (closed/unused)
├── Port 3000 (EXPOSED) → Search frontend
├── Port 3001 (closed)
├── Port 8080 (closed) → Backend running inside
├── Port 8081 (closed) → Backend running inside
└── Rest (closed)

Access: http://34.56.78.90:3000 (ugly!)
```

### Needed Setup (With Nginx)

```
GCP Server (34.56.78.90)
├── Port 80 (EXPOSED) → Nginx listening here
├── Port 443 (EXPOSED) → Nginx with SSL here
├── Port 3000 (localhost only) → Search frontend
├── Port 3001 (localhost only) → Compass frontend
├── Port 8080 (localhost only) → Maps backend
├── Port 8081 (localhost only) → Search backend
└── Rest (closed)

Access:
search.pclub.com → Port 80 → Nginx → Port 3000 (clean!)
compass.pclub.com → Port 80 → Nginx → Port 3001 (clean!)
api.pclub.com → Port 80 → Nginx → Port 8081 (clean!)
```

---

## Step-by-Step Nginx Setup Process

### 1. Install Nginx
```bash
sudo dnf install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Configure Nginx
Create `/etc/nginx/conf.d/compass.conf`:

```nginx
# Search App
server {
    listen 80;
    server_name search.pclub.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Compass App
server {
    listen 80;
    server_name compass.pclub.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# API Server
server {
    listen 80;
    server_name api.pclub.com;
    
    location /search {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /maps {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Test & Reload
```bash
sudo nginx -t              # Test configuration
sudo systemctl reload nginx # Apply changes
```

### 4. Point Domain to IP
Go to your domain registrar (GoDaddy, Namecheap, etc.):

```
DNS Records to Add:
Type    Name              Value (Your GCP IP)
A       search.pclub.com  34.56.78.90
A       compass.pclub.com 34.56.78.90
A       api.pclub.com     34.56.78.90
```

### 5. Add SSL Certificate (HTTPS)
```bash
sudo dnf install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d search.pclub.com -d compass.pclub.com -d api.pclub.com

# Update nginx.conf to use SSL (change listen 80 to listen 443 ssl)
# Add SSL certificate paths
sudo systemctl reload nginx
```

---

## Key Nginx Concepts

### 1. **Reverse Proxy**
Nginx sits in front and forwards requests to backends:
```
User → Nginx → Backend App
                ↓ Response
           User ← Nginx
```

### 2. **Load Balancer** (Advanced)
Can distribute traffic to multiple backend instances:
```
User → Nginx → Backend 1
             → Backend 2
             → Backend 3
```

### 3. **Header Forwarding**
Nginx passes important headers:
```nginx
proxy_set_header X-Real-IP $remote_addr;      # Real user IP
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header Host $host;                  # Domain name
```

### 4. **Virtual Hosts**
Multiple `server` blocks handle different domains:
```
Each server {} block = different domain routing
```

---

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **URL Format** | `34.56.78.90:3000` | `search.pclub.com` |
| **Multiple Apps** | Need different ports | All on port 80 |
| **SSL/HTTPS** | Complex per-app | One place to manage |
| **Performance** | Each app exposed | Nginx can compress, cache |
| **Security** | All ports visible | Only 80/443 exposed |
| **Subdomains** | Can't route by domain | Perfect domain routing |

---

## Quick Mental Model

**Think of Nginx as a switchboard operator:**

```
User calls and says: "I want to speak to search"
Nginx operator hears the request
Looks at the "host" name: "search.pclub.com"
Connects the call to line 3000 (search frontend)
Call goes through, conversation happens
Result: User gets what they asked for ✓

Next user calls: "I want to speak to compass"
Nginx operator hears: "compass.pclub.com"
Connects to line 3001 (compass frontend)
Connection established ✓

Next user asks: "I need API info about maps"
Nginx operator hears: "api.pclub.com/maps"
Connects to line 8080 (maps backend)
Connection established ✓
```

All calls come through the same main switchboard (Nginx on port 80), but get routed to the right extensions (different ports) based on what the caller asked for.

---

## Visual Diagram

```
                          INTERNET
                             ↑
                    Domain: pclub.com
                    IP: 34.56.78.90
                             ↑
                        ┌─────────────┐
                        │ Nginx (P:80)│ ← SWITCHBOARD
                        └─────────────┘
                      ↙     ↓     ↘
        search.pclub ↙      ↓      ↘ compass.pclub
                    ↙       ↓       ↘
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Frontend │ │ Frontend │ │  Backend │
            │ :3000    │ │ :3001    │ │ :8080-81 │
            │ (Search) │ │(Compass) │ │ (APIs)   │
            └──────────┘ └──────────┘ └──────────┘
                ↓            ↓             ↓
            ┌─────────────────────────────────────┐
            │     Your Applications               │
            │    (Only accessible via Nginx)      │
            └─────────────────────────────────────┘
```

---

## TL;DR

**What does Nginx do?**
- Listens on ports 80/443 (the public "front door")
- Reads the domain name from the request
- Routes traffic to different apps based on domain/path
- Handles SSL/HTTPS certificates
- Makes clean URLs possible (no ports visible)

**How does it help?**
- Multiple apps behind ONE IP address
- Each app gets a clean domain name
- Better security (ports hidden)
- Easier SSL management
- Professional URLs for users

**Your case:**
- Right now: Port 3000 exposed to internet (ugly)
- With Nginx: Port 80 exposed, everything routed behind the scenes (professional)
- Users visit: `search.pclub.com` instead of `34.56.78.90:3000` ✓
