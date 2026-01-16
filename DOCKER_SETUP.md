# Backend Server Setup with Docker Compose (dnf-based Systems)

This guide covers setting up and running the Campus Compass backend (Go), PostgreSQL, and RabbitMQ using Docker Compose on Fedora/RHEL-based systems with dnf package manager.

---

## Prerequisites

- dnf-based Linux system (Fedora, RHEL, CentOS, AlmaLinux)
- Root or sudo access
- Minimum 4GB RAM, 10GB disk space

---

## Step 1: Install Docker and Docker Compose

### Install Docker

```bash
# Install Docker and required dependencies
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Start Docker Service

```bash
# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker compose version
```

### Add User to Docker Group (Optional)

```bash
# Allows running docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

---

## Step 2: Clone Repository (if not already done)

```bash
cd /opt
sudo git clone https://github.com/your-repo/compass.git
sudo chown -R $USER:$USER compass
cd compass/server
```

---

## Step 3: Configure Backend Secrets

### Setup secret.yml

```bash
cd ~/compass/server

# Copy template to create secret.yml
cp secret.yml.template secret.yml

# Edit with your configuration
nano secret.yml
```

**Important configurations:**
- Database credentials (should match docker-compose.yml)
- API keys for third-party services
- JWT secret for authentication
- Email service credentials
- OpenAI API key (if used)

---

## Step 4: Verify Docker Compose Configuration

The `docker-compose.yml` is already configured with three services:

### Check current configuration

```bash
cat docker-compose.yml
```

Key services:
- **postgres**: PostgreSQL 15 database
- **rabbitmq**: RabbitMQ message broker with management UI
- **server**: Go backend application (built from Dockerfile)

---

## Step 5: Build Docker Images

```bash
cd ~/compass/server

# Build the Go backend image and pull base images for postgres/rabbitmq
docker compose build

# Show built images
docker images | grep -E "compass|postgres|rabbitmq"
```

---

## Step 6: Start All Services with Docker Compose

### Start Services

```bash
cd ~/compass/server

# Start all containers in background (-d for detached)
docker compose up -d

# Verify all services are running
docker compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE             STATUS          PORTS
compass-server-1    "/server"                server              Up (healthy)    0.0.0.0:8080->8080/tcp, ...
postgres-1          "docker-entrypoint.s…"  postgres            Up (healthy)    0.0.0.0:5432->5432/tcp
rabbitmq-1          "docker-entrypoint.s…"  rabbitmq            Up (healthy)    5672/tcp, 0.0.0.0:15672->15672/tcp
```

---

## Step 7: Verify Services Are Running Correctly

### Check Service Health

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f server      # Backend logs
docker compose logs -f postgres    # Database logs
docker compose logs -f rabbitmq    # RabbitMQ logs
```

### Test Services

```bash
# Test PostgreSQL connectivity
docker exec compass-postgres-1 psql -U this_is_mjk -d compass -c "SELECT 1"

# Test RabbitMQ health
docker exec rabbitmq-1 rabbitmq-diagnostics ping

# Test Backend API (once running)
curl http://localhost:8080/health
```

### Access RabbitMQ Management UI

```
URL: http://localhost:15672
Default credentials:
- Username: guest
- Password: guest
```

---

## Step 8: Common Docker Compose Commands

```bash
# View running containers
docker compose ps

# View service logs (follow mode)
docker compose logs -f

# View logs for specific service
docker compose logs -f server

# Stop all services
docker compose stop

# Start services again
docker compose start

# Restart services
docker compose restart server

# Stop and remove containers (keeps volumes)
docker compose down

# Stop and remove containers + volumes
docker compose down -v

# View resource usage
docker stats

# Execute command in running container
docker exec -it compass-server-1 /bin/bash
docker exec -it compass-postgres-1 psql -U this_is_mjk -d compass
```

---

## Step 9: Database Management

### Access PostgreSQL

```bash
# Connect to PostgreSQL from host
psql -h localhost -U this_is_mjk -d compass

# Or use docker exec
docker exec -it compass-postgres-1 psql -U this_is_mjk -d compass
```

### Useful PostgreSQL Commands

```sql
-- List all tables
\dt

-- View table structure
\d table_name

-- Check database size
SELECT pg_database.datname, pg_size_pretty(pg_database.pg_database_size(pg_database.datname)) FROM pg_database;

-- View active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### Backup Database

```bash
# Create backup
docker exec compass-postgres-1 pg_dump -U this_is_mjk compass > compass_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat compass_backup_*.sql | docker exec -i compass-postgres-1 psql -U this_is_mjk -d compass
```

---

## Step 10: Troubleshooting

### Issue: Backend Service Fails to Start

```bash
# Check logs
docker compose logs server

# Common issues:
# 1. RabbitMQ/PostgreSQL not ready - services have healthcheck with retries
# 2. Connection strings wrong - verify secret.yml environment variables
# 3. Database migrations failed - check logs for details
```

### Issue: Port Already in Use

```bash
# Find process using port
sudo lsof -i :8080   # Backend
sudo lsof -i :5432   # PostgreSQL
sudo lsof -i :5672   # RabbitMQ

# Kill process or change port in docker-compose.yml
```

### Issue: Containers Not Starting

```bash
# Check Docker daemon status
sudo systemctl status docker

# Check system resources
docker system df
docker system prune -a  # Clean up unused resources

# Rebuild images
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Issue: Database Connection Refused

```bash
# Verify PostgreSQL is healthy
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Verify credentials in secret.yml match docker-compose.yml
grep POSTGRES docker-compose.yml
cat secret.yml | grep -i postgres
```

### Issue: RabbitMQ Management UI Not Accessible

```bash
# Verify RabbitMQ is running
docker compose ps rabbitmq

# Check RabbitMQ logs
docker compose logs rabbitmq

# Try accessing the service
docker exec rabbitmq-1 rabbitmq-diagnostics status
```

---

## Step 11: Useful Maintenance Commands

### View Resource Usage

```bash
# Real-time resource usage
docker stats

# Check disk usage
docker system df

# Inspect container
docker inspect compass-server-1
```

### Cleanup and Maintenance

```bash
# Remove unused images, containers, networks
docker system prune

# Remove unused volumes (WARNING: deletes data)
docker volume prune

# Rebuild specific service
docker compose build --no-cache server
docker compose up -d server
```

### Scale Services (Advanced)

```bash
# Note: Backend server can't be scaled (single instance with ports)
# But you can scale PostgreSQL replicas if needed using separate compose file
```

---

## Step 12: Environment Variables

Environment variables are set in `docker-compose.yml` and used by the Go backend:

```yaml
environment:
  POSTGRES_HOST: postgres          # Internal Docker hostname
  RABBITMQ_HOST: rabbitmq          # Internal Docker hostname
  GO111MODULE: on                  # Go module mode
```

To add more variables:
1. Edit `docker-compose.yml` under `server.environment`
2. Or create `.env` file and reference it
3. Restart: `docker compose up -d server`

---

## Step 13: Production Checklist

- [ ] Set strong database password in `secret.yml`
- [ ] Configure SSL/TLS for backend API
- [ ] Setup log aggregation (ELK, Datadog, etc.)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Setup monitoring and alerts
- [ ] Configure resource limits in docker-compose.yml
- [ ] Use secrets management (Docker Secrets, Vault)
- [ ] Implement rate limiting and API throttling
- [ ] Setup health check monitoring
- [ ] Document any custom configurations

---

## Quick Start Summary

```bash
# 1. Navigate to server directory
cd ~/compass/server

# 2. Configure secrets
cp secret.yml.template secret.yml
nano secret.yml

# 3. Build and start all services
docker compose build
docker compose up -d

# 4. Verify all services running
docker compose ps

# 5. Check backend is healthy
curl http://localhost:8080/health

# 6. View logs
docker compose logs -f
```

---

## Next Steps

1. **Test Backend APIs** - Use Postman or curl to test endpoints
2. **Setup Frontend** - Follow frontend setup guide separately
3. **Configure Nginx** - Setup reverse proxy if needed
4. **Setup Monitoring** - Add Prometheus, Grafana, or similar
5. **Implement Backups** - Setup automated PostgreSQL backups
6. **Security Hardening** - Implement SSL/TLS, rate limiting, etc.

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq)
- [Go Docker Best Practices](https://docs.docker.com/language/golang/)
