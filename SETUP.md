# Campus Compass - Local Setup Guide

## Prerequisites

- **Docker & Docker Compose** installed
- **Go 1.24.4** or higher
- **Node.js 18+** and **npm**
- **Git** (for version control)


---



## Step-by-Step Setup

### Step 1: Clone the Repository


---

### Step 2: Configure Backend Secrets

#### 2a. Create `secret.yml` from template

```bash
cd ./compass/server
cp secret.yml.template secret.yml
```

#### 2b. Edit `secret.yml` with your credentials

---

### Step 3: Configure Frontend Environment

#### 3a. Create `.env.local` in the root directory from `.env.example`


---

## Running the Application

### Start Docker Services (PostgreSQL + RabbitMQ)

```bash
cd ./compass/server
docker-compose up postgres rabbitmq
```


---

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

---
