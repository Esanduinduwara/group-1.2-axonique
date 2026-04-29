# AxoNique 🛍️

AxoNique is a modern e-commerce platform featuring a sophisticated rule-based chatbot, advanced item tracking, and a seamless shopping experience. It is built as an enhancement to the original Axo Clothing website.

## 🚀 Quick Start

1. Ensure **Docker Desktop** is running.
2. Run the main orchestration script:
   ```cmd
   .\run_all.bat
   ```
3. For detailed setup and troubleshooting, see [GUIDE.md](./GUIDE.md).

## 🏗️ Project Structure

- **`axonique_backend/`**: A Spring Boot application providing REST APIs for product management, orders, and spatial logic.
- **`axonique-frontend/`**: A high-performance React application built with Vite and TailwindCSS, featuring the **AXO Concierge** chatbot.
- **`docker-compose.yml`**: Orchestrates the MySQL 8.0 database and environment services.
- **`run_all.bat`**: A robust PowerShell/Batch script that handles cleaning, building, and launching the entire stack.

## 🛠️ Technical Specifications

### Backend (axonique_backend)
- **Language**: Java 21 LTS
- **Framework**: Spring Boot 3.4.3
- **Security**: Spring Security + JWT (JSON Web Tokens)
- **Data**: Spring Data JPA + MySQL Connector
- **Mailing**: Resend Java SDK

### Frontend (axonique-frontend)
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript
- **Styling**: TailwindCSS & Vanilla CSS

### Infrastructure
- **Database**: MySQL 8.0 (Containerized)
- **Containerization**: Docker & Docker Compose

## ✨ Key Features

- **AXO Concierge**: A logic-heavy, multi-turn chatbot for product discovery and cart management.
- **Distributed Reliability**: Built with resilience in mind, including fault-tolerant backend services.
- **Dynamic E-Commerce**: Real-time cart mutations, wishlist transfers, and order tracking.
