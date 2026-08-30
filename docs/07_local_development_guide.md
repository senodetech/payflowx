# Local Development Guide - PayFlowX

Follow these instructions to run the PayFlowX backend API, database, cache, and frontend dashboard on your local Windows machine.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** v20.x or higher
- **NPM:** v10.x or higher
- **PostgreSQL:** Installed locally on port `5432` with user `postgres` and password `root`.
- **Redis (Memurai):** Installed and running on port `6379`.

---

## 2. Infrastructure Setup

### Create PostgreSQL Database
1. Open your PostgreSQL terminal (pgAdmin, psql, or DBeaver).
2. Connect to the local instance using:
   - Username: `postgres`
   - Password: `root`
3. Execute the database creation command:
   ```sql
   CREATE DATABASE payflowx;
   ```

### Verify Redis / Memurai
1. Open PowerShell.
2. Run:
   ```powershell
   memurai-cli ping
   ```
3. If it returns `PONG`, Redis is ready to accept connections.

---

## 3. Clone & Project Initialization

Navigate to the project directory:
```powershell
cd F:/portfolio/projects/payflowx
```

### Install API Backend Dependencies
1. Navigate to the API application:
   ```powershell
   cd apps/api
   ```
2. Install npm packages:
   ```powershell
   npm install
   ```

### Install Dashboard Frontend Dependencies
1. Navigate to the dashboard application:
   ```powershell
   cd ../dashboard
   ```
2. Install npm packages:
   ```powershell
   npm install
   ```

---

## 4. Environment Variables Configuration

Create a `.env` file under `F:/portfolio/projects/payflowx/apps/api/.env` with the following variables:

```env
PORT=3000
NODE_ENV=development

# Database Setup
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=payflowx

# Redis Setup
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication JWT
JWT_ACCESS_SECRET=super_secret_access_key_123_abc_xyz
JWT_REFRESH_SECRET=super_secret_refresh_key_456_lmn_opq
JWT_ACCESS_EXPIRATION=900s
JWT_REFRESH_EXPIRATION=604800s

# Webhook Retry Configs
WEBHOOK_MAX_RETRIES=5
```

---

## 5. Running the Application

### Start NestJS API Server
1. Open a new PowerShell terminal.
2. Navigate to `apps/api`:
   ```powershell
   cd F:/portfolio/projects/payflowx/apps/api
   ```
3. Start the application in hot-reload watch mode:
   ```powershell
   npm run start:dev
   ```

### Start Angular Dashboard Development Server
1. Open another PowerShell terminal.
2. Navigate to `apps/dashboard`:
   ```powershell
   cd F:/portfolio/projects/payflowx/apps/dashboard
   ```
3. Run the dev server:
   ```powershell
   npm run start
   ```
4. Access the dashboard via your browser at [http://localhost:4200](http://localhost:4200).
