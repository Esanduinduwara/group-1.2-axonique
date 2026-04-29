# Build & Run Guide

This guide covers the standard setup and troubleshooting steps for the AxoNique project.

## 🚀 Quick Start (Automated)

The easiest way to run the entire project (MySQL, Backend, and Frontend) is using the orchestration script:

1. Open a terminal in the root directory.
2. Run:
   ```cmd
   .\run_all.bat
   ```
   *This script will automate Docker setup, Maven builds, and start both services in separate windows.*

---

## 🛠 Manual Setup

If you prefer to run components individually:

### 1. Database (Docker)
Ensure Docker Desktop is running and execute:
```bash
docker compose up -d
```

### 2. Backend (Spring Boot)
Requires JDK 21+.
```bash
cd axonique_backend
.\mvnw.cmd spring-boot:run
```

### 3. Frontend (React/Vite)
Requires Node.js.
```bash
cd axonique-frontend
npm install
npm run dev
```

---

## 🔍 Troubleshooting Docker

If `run_all.bat` fails at the Docker step or says it cannot connect to the Docker API, follow these steps:

### 1. Check Service Status
If the Docker Desktop UI is open but "disconnected":
- **Restart Docker Desktop** as Administrator.
- Ensure the **Docker Desktop Service** is running in Windows Services (`services.msc`).

### 2. The "Clean Slate" Fix
If you see `connect ENOENT` pipes error or ghost containers:
1. Open Docker Desktop.
2. Go to **Settings** > **Troubleshoot** (bug icon).
3. Select **Clean / Purge data**.
4. Check **WSL 2** and click **Delete**.
5. Restart Docker Desktop and run `.\run_all.bat` again.

---

## 📂 Project Structure

- `axonique_backend/`: Java Spring Boot API.
- `axonique-frontend/`: React + Vite frontend with AXO Concierge chatbot.
- `docker-compose.yml`: MySQL 8.0 database configuration.
- `init.sql`: Main database schema and seed data.
