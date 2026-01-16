# Nginx Setup - Complete Step-by-Step Guide

## Prerequisites Checklist
- [ ] GCP server running (Linux, dnf-based)
- [ ] Domain registered (e.g., pclub.com)
- [ ] Your applications running:
  - [ ] Search frontend on port 3000
  - [ ] Compass frontend on port 3001
  - [ ] Backend APIs on ports 8080, 8081, etc.
- [ ] SSH access to your server

---

## Step 1: Connect to Your GCP Server

```bash
# SSH into your server
ssh -i your_key.pem user@your_gcp_ip

# Example:
# ssh -i ~/.ssh/gcp-key.pem ubuntu@34.56.78.90

# Once connected, verify you're on the server
whoami
```

---

## Step 2: Install Nginx

```bash
# Update system packages
sudo dnf update -y

# Install Nginx
sudo dnf install -y nginx

# Start Nginx service
sudo systemctl start nginx

# Enable Nginx to start on reboot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx

# Check Nginx version
nginx -v
```

**Expected output:**
```
Active: active (running) since...
```

---

## Step 3: Create Nginx Configuration File

### 3a. Create the config file

```bash
# Create a new Nginx configuration file
sudo nano /etc/nginx/conf.d/compass.conf
```

### 3b. Paste this configuration

```nginx
# ========================================
# SEARCH APP - search.pclub.com
# ========================================
server {
    listen 80;
    listen [::]:80;  # IPv6 support
    server_name search.pclub.com;

    # Access and error logs
    access_log /var/log/nginx/search_access.log;
    error_log /var/log/nginx/search_error.log;

    # Redirect HTTP to HTTPS (we'll add this after SSL setup)
    # For now, serve on HTTP

    location / {
        # Forward requests to the search frontend running on port 3000
        proxy_pass http://localhost:3000;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed for real-time features)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ========================================
# COMPASS APP - compass.pclub.com
# ========================================
server {
    listen 80;
    listen [::]:80;  # IPv6 support
    server_name compass.pclub.com;

    # Access and error logs
    access_log /var/log/nginx/compass_access.log;
    error_log /var/log/nginx/compass_error.log;

    location / {
        # Forward requests to the compass frontend running on port 3001
        proxy_pass http://localhost:3001;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ========================================
# API SERVER - api.pclub.com
# ========================================
server {
    listen 80;
    listen [::]:80;  # IPv6 support
    server_name api.pclub.com;

    # Access and error logs
    access_log /var/log/nginx/api_access.log;
    error_log /var/log/nginx/api_error.log;

    # Search API endpoints
    location /search {
        # Forward requests to search backend on port 8081
        proxy_pass http://localhost:8081;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Maps/Compass API endpoints
    location /maps {
        # Forward requests to maps backend on port 8080
        proxy_pass http://localhost:8080;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Assets/Upload API endpoints
    location /assets {
        # Forward requests to assets backend on port 8082
        proxy_pass http://localhost:8082;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;  # 5 minutes for uploads
        proxy_read_timeout 300s;
    }

    # Auth API endpoints
    location /auth {
        # Forward requests to auth backend on port 8083
        proxy_pass http://localhost:8083;

        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**To save the file:**
1. Press `Ctrl + X`
2. Press `Y` (Yes)
3. Press `Enter`

---

## Step 4: Test Nginx Configuration

```bash
# Test the configuration syntax
sudo nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration will be useful
```

If you get errors, check the file for typos and try again.

---

## Step 5: Reload Nginx with New Configuration

```bash
# Reload Nginx to apply the configuration
sudo systemctl reload nginx

# Verify it's still running
sudo systemctl status nginx

# Check that Nginx is listening on port 80
sudo ss -tlnp | grep nginx
```

**Expected output:**
```
LISTEN   0   511   0.0.0.0:80   0.0.0.0:*   users:(("nginx",pid=...
```

---

## Step 6: Open Firewall Ports (if using GCP Firewall)

### In GCP Console or via gcloud:

```bash
# Allow HTTP traffic (port 80)
gcloud compute firewall-rules create allow-http \
    --allow=tcp:80 \
    --source-ranges=0.0.0.0/0

# Allow HTTPS traffic (port 443)
gcloud compute firewall-rules create allow-https \
    --allow=tcp:443 \
    --source-ranges=0.0.0.0/0

# Verify rules were created
gcloud compute firewall-rules list
```

Or in the GCP Console:
1. Go to VPC Network → Firewall
2. Click "Create Firewall Rule"
3. Name: `allow-http-https`
4. Targets: `All instances`
5. Source IP ranges: `0.0.0.0/0`
6. Protocols and ports: `TCP: 80, 443`
7. Click Create

---

## Step 7: Update DNS Records at Your Domain Registrar

This is the **crucial step** that makes your domains point to your server.

### Where to do this:
- GoDaddy, Namecheap, Domain.com, Cloudflare, Google Domains, etc.

### What to add:

For each domain, add these **A records**:

```
Type    Name              Value (Your GCP Server IP)
A       search.pclub.com  34.56.78.90  (replace with your GCP IP)
A       compass.pclub.com 34.56.78.90  (same IP)
A       api.pclub.com     34.56.78.90  (same IP)
```

### Example (GoDaddy):
1. Log in to GoDaddy
2. Go to "My Products" → Domain
3. Click "Manage DNS"
4. Click "Add Record"
5. Type: `A`
6. Name: `search` (or `compass`, or `api`)
7. Value: Your GCP IP (e.g., `34.56.78.90`)
8. TTL: 3600 (or default)
9. Click Save
10. Repeat for `compass` and `api`

### Example (Namecheap):
1. Log in to Namecheap
2. Go to "Domain List"
3. Click "Manage" next to your domain
4. Go to "Advanced DNS"
5. Add/Edit Host Records
6. Host: `search`, Type: `A`, Value: Your GCP IP
7. Host: `compass`, Type: `A`, Value: Your GCP IP
8. Host: `api`, Type: `A`, Value: Your GCP IP
9. Save

---

## Step 8: Wait for DNS to Propagate

DNS changes take time to propagate (usually 5 minutes to 24 hours).

### Check if DNS is ready:

```bash
# Check from your local machine
nslookup search.pclub.com
dig search.pclub.com

# Expected output: Should show your GCP server IP
# Example:
# search.pclub.com has address 34.56.78.90
```

Or use online tools:
- https://www.whatsmydns.net/
- https://mxtoolbox.com/

---

## Step 9: Test Your Setup (Before SSL)

Once DNS is propagated, test your domains:

```bash
# From your local machine, test if Nginx is responding

# Test Search domain
curl -I http://search.pclub.com

# Test Compass domain
curl -I http://compass.pclub.com

# Test API domain
curl -I http://api.pclub.com/search

# Expected output: HTTP/1.1 200 OK or similar
```

Or in your browser:
- Visit `http://search.pclub.com` (should show search frontend)
- Visit `http://compass.pclub.com` (should show compass frontend)
- Check browser console for API calls to `http://api.pclub.com`

---

## Step 10: Setup SSL/HTTPS with Let's Encrypt (RECOMMENDED)

This makes your sites secure with HTTPS.

### 10a. Install Certbot

```bash
# Install certbot and Nginx plugin
sudo dnf install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### 10b. Get SSL Certificates

```bash
# Request certificates for all your domains
sudo certbot certonly --nginx \
    -d search.pclub.com \
    -d compass.pclub.com \
    -d api.pclub.com

# Follow the prompts:
# - Enter your email
# - Accept terms
# - Agree to share email (optional)

# After success, certificates are at:
# /etc/letsencrypt/live/search.pclub.com/
```

### 10c. Update Nginx to Use SSL

Edit the configuration file again:

```bash
sudo nano /etc/nginx/conf.d/compass.conf
```

Replace the beginning of each server block with:

```nginx
# SEARCH SERVER - with SSL
server {
    listen 80;
    listen [::]:80;
    server_name search.pclub.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name search.pclub.com;

    # SSL Certificate paths
    ssl_certificate /etc/letsencrypt/live/search.pclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/search.pclub.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest of the configuration stays the same...
    location / {
        proxy_pass http://localhost:3000;
        # ... rest of config
    }
}

# COMPASS SERVER - with SSL
server {
    listen 80;
    listen [::]:80;
    server_name compass.pclub.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name compass.pclub.com;

    # SSL Certificate paths
    ssl_certificate /etc/letsencrypt/live/compass.pclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/compass.pclub.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest of the configuration stays the same...
    location / {
        proxy_pass http://localhost:3001;
        # ... rest of config
    }
}

# API SERVER - with SSL
server {
    listen 80;
    listen [::]:80;
    server_name api.pclub.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pclub.com;

    # SSL Certificate paths
    ssl_certificate /etc/letsencrypt/live/api.pclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pclub.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest of the configuration stays the same...
    location /search {
        proxy_pass http://localhost:8081;
        # ... rest of config
    }

    location /maps {
        proxy_pass http://localhost:8080;
        # ... rest of config
    }

    # ... other locations
}
```

### 10d. Test and Reload

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Verify running
sudo systemctl status nginx
```

### 10e. Setup Auto-Renewal (Important!)

```bash
# SSL certificates expire in 90 days
# Setup auto-renewal

# Test the renewal process
sudo certbot renew --dry-run

# Enable automatic renewal
sudo systemctl enable certbot-renew
sudo systemctl start certbot-renew

# Verify
sudo systemctl status certbot-renew
```

---

## Step 11: Test SSL Setup

```bash
# Test from command line
curl -I https://search.pclub.com
curl -I https://compass.pclub.com
curl -I https://api.pclub.com

# Expected output: HTTP/2 200 or similar
```

Or visit in browser:
- `https://search.pclub.com` (should show green lock)
- `https://compass.pclub.com` (should show green lock)
- `https://api.pclub.com` (should show green lock)

---

## Step 12: View Logs and Monitor

### Monitor Nginx in real-time

```bash
# View live access logs
tail -f /var/log/nginx/search_access.log

# View error logs
tail -f /var/log/nginx/search_error.log

# View all traffic
tail -f /var/log/nginx/access.log

# Check Nginx status
sudo systemctl status nginx

# Check resource usage
top
```

---

## Step 13: Common Troubleshooting

### Issue: Domain still shows "This site can't be reached"

```bash
# 1. Check DNS propagation
dig search.pclub.com

# 2. Check if Nginx is listening on port 80
sudo ss -tlnp | grep nginx

# 3. Check if firewall allows port 80
sudo firewall-cmd --list-all

# 4. Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Backend returns 502 Bad Gateway

```bash
# 1. Verify your applications are running
ps aux | grep -E "3000|3001|8080|8081"

# 2. Try accessing directly (from server)
curl http://localhost:3000
curl http://localhost:8081

# 3. Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# 4. Restart the application if needed
docker-compose restart server
```

### Issue: Certificate not renewing

```bash
# 1. Check renewal log
sudo cat /var/log/letsencrypt/letsencrypt.log

# 2. Manually renew
sudo certbot renew --force-renewal

# 3. Check certificate expiry
sudo certbot certificates
```

### Issue: Mixed content warning (HTTP mixed with HTTPS)

```bash
# Ensure your frontend makes API calls to https://api.pclub.com
# Not http://api.pclub.com

# Check browser console for warnings
# Update your frontend code if needed
```

---

## Complete Command Summary

```bash
# === INSTALLATION ===
sudo dnf update -y
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# === CONFIGURATION ===
sudo nano /etc/nginx/conf.d/compass.conf
# Paste the configuration from Step 3b

# === TESTING ===
sudo nginx -t
sudo systemctl reload nginx

# === SSL (Optional but Recommended) ===
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d search.pclub.com -d compass.pclub.com -d api.pclub.com
# Update compass.conf with SSL settings

# === FINAL RELOAD ===
sudo nginx -t
sudo systemctl reload nginx

# === MONITORING ===
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Verification Checklist

- [ ] Nginx installed and running (`sudo systemctl status nginx`)
- [ ] Configuration file created (`/etc/nginx/conf.d/compass.conf`)
- [ ] DNS records added to domain registrar (A records for all subdomains)
- [ ] DNS propagated (test with `nslookup` or whatsmydns.net)
- [ ] HTTP works (`curl http://search.pclub.com`)
- [ ] Your apps accessible via domains in browser
- [ ] SSL certificates obtained (`sudo certbot certificates`)
- [ ] HTTPS works (`curl https://search.pclub.com`)
- [ ] Green lock in browser (no SSL warnings)
- [ ] Backend APIs accessible (`curl https://api.pclub.com/search`)

---

## Next Steps

1. **Monitor logs** - Keep an eye on error logs for issues
2. **Performance tuning** - Adjust Nginx settings if needed
3. **Load balancing** - If scaling, add multiple backend instances
4. **Caching** - Enable Nginx caching for better performance
5. **Rate limiting** - Protect against abuse
6. **Monitoring** - Setup alerts for downtime

---

## Quick Reference

```
Your GCP Server IP: 34.56.78.90 (replace with your IP)
Domain: pclub.com

Frontend:
- search.pclub.com → localhost:3000 (Search UI)
- compass.pclub.com → localhost:3001 (Compass UI)

Backend APIs:
- api.pclub.com/search → localhost:8081 (Search API)
- api.pclub.com/maps → localhost:8080 (Maps API)
- api.pclub.com/auth → localhost:8083 (Auth API)
- api.pclub.com/assets → localhost:8082 (Asset API)

Nginx listens on:
- Port 80 (HTTP) - redirects to 443
- Port 443 (HTTPS) - main traffic
```
