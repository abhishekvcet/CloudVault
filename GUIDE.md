# 📖 CloudVault — Complete Setup & Deployment Guide

> **Start-to-finish guide** to get CloudVault running locally and deployed on AWS EC2.

---

## 📋 Table of Contents

1. [What You Need (Prerequisites)](#1--what-you-need-prerequisites)
2. [AWS Setup — S3 Bucket](#2--aws-setup--s3-bucket)
3. [AWS Setup — IAM User (Credentials)](#3--aws-setup--iam-user-credentials)
4. [AWS Setup — RDS MySQL (Optional)](#4--aws-setup--rds-mysql-optional)
5. [Configure Environment Variables](#5--configure-environment-variables)
6. [Run Locally (Without Docker)](#6--run-locally-without-docker)
7. [Run Locally (With Docker)](#7--run-locally-with-docker)
8. [AWS Setup — EC2 Instance](#8--aws-setup--ec2-instance)
9. [Deploy to EC2](#9--deploy-to-ec2)
10. [Verify Everything Works](#10--verify-everything-works)
11. [Troubleshooting](#11--troubleshooting)
12. [Checklist Summary](#12--checklist-summary)

---

## 1. 🧰 What You Need (Prerequisites)

### For Local Development
| Tool | Version | Download |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Git | Any | https://git-scm.com |

### For Docker Deployment
| Tool | Version | Download |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2+ | Included with Docker Desktop |

### AWS Accounts & Services
| Service | Purpose | Cost |
|---|---|---|
| AWS Account | Required for all services | Free to create |
| S3 | File storage | Free tier: 5GB for 12 months |
| EC2 | Host the app | Free tier: t2.micro for 12 months |
| RDS (Optional) | Managed MySQL | Free tier: db.t3.micro for 12 months |

> **💡 Tip**: If you're a student, apply for [AWS Educate](https://aws.amazon.com/education/awseducate/) for free credits.

---

## 2. 🪣 AWS Setup — S3 Bucket

### Step 2.1: Create an S3 Bucket

1. Go to **AWS Console** → Search for **S3** → Click **Create bucket**
2. Fill in:
   - **Bucket name**: `cloudvault-files-yourname` (must be globally unique)
   - **AWS Region**: `us-east-1` (or your preferred region — remember this!)
3. **Object Ownership**: Select **ACLs disabled**
4. **Block Public Access**: ✅ Keep **"Block all public access"** checked
   - CloudVault uses **presigned URLs** so no public access is needed
5. Leave everything else as default
6. Click **Create bucket**

### Step 2.2: Configure CORS (Required for browser uploads)

1. Go to your bucket → **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)** → Click **Edit**
3. Paste this JSON:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

4. Click **Save changes**

> **📝 Note down**: Your **bucket name** and **region** — you'll need them in Step 5.

---

## 3. 🔑 AWS Setup — IAM User (Credentials)

### Step 3.1: Create an IAM User

1. Go to **AWS Console** → Search for **IAM** → Click **Users** → **Create user**
2. **User name**: `cloudvault-app`
3. Click **Next**
4. **Permissions**: Select **Attach policies directly**
5. Search and check: **AmazonS3FullAccess**
6. Click **Next** → **Create user**

### Step 3.2: Create Access Keys

1. Click on the user `cloudvault-app`
2. Go to **Security credentials** tab
3. Scroll to **Access keys** → Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **⚠️ IMPORTANT**: Copy both values immediately!

```
Access Key ID:     AKIA...............
Secret Access Key: wJalr.............................
```

> **🚨 WARNING**: The Secret Access Key is shown **only once**. Save it securely.
> Never commit these keys to Git. They go in your `.env` file only.

---

## 4. 🗄️ AWS Setup — RDS MySQL (Optional)

> **Skip this step** if you're using Docker (Docker Compose includes MySQL).
> Only needed if you want a managed AWS database for production.

### Step 4.1: Create RDS Instance

1. Go to **AWS Console** → Search for **RDS** → **Create database**
2. Settings:
   - **Engine**: MySQL 8.0
   - **Template**: Free tier
   - **DB Instance Identifier**: `cloudvault-db`
   - **Master username**: `admin`
   - **Master password**: Choose a strong password (save it!)
   - **Instance class**: `db.t3.micro`
   - **Storage**: 20 GB (default)
3. **Connectivity**:
   - **Public access**: Yes (for initial setup, restrict later)
   - **VPC Security group**: Create new or use existing
4. **Additional configuration**:
   - **Initial database name**: `cloudvault`
5. Click **Create database** (takes 5-10 minutes)

### Step 4.2: Configure Security Group

1. Go to your RDS instance → **Connectivity & security**
2. Click on the **VPC security group**
3. Edit **Inbound rules** → Add rule:
   - Type: **MySQL/Aurora**
   - Port: **3306**
   - Source: Your EC2 security group ID (or your IP for local testing)

> **📝 Note down**: The **Endpoint** (hostname), **Port**, **Username**, **Password**, **Database name**.

---

## 5. ⚙️ Configure Environment Variables

### Step 5.1: Create the .env file

```bash
# From the project root
cp .env.example .env
```

### Step 5.2: Edit .env with your values

Open `.env` in your editor and fill in:

```env
# ===== Database =====
# For Docker: leave these defaults (Docker Compose creates the DB)
# For RDS: use your RDS endpoint and credentials
DB_ROOT_PASSWORD=rootpassword
DB_NAME=cloudvault
DB_USER=cloudvault_user
DB_PASSWORD=cloudvault_pass

# ===== AWS S3 (REQUIRED — fill these in!) =====
AWS_ACCESS_KEY_ID=AKIA________________        ← from Step 3.2
AWS_SECRET_ACCESS_KEY=wJalr_______________    ← from Step 3.2
AWS_REGION=us-east-1                          ← from Step 2.1
AWS_S3_BUCKET=cloudvault-files-yourname       ← from Step 2.1

# ===== JWT Secret (REQUIRED — change this!) =====
JWT_SECRET=my-super-secret-random-string-change-me-in-production
JWT_EXPIRES_IN=7d

# ===== Upload =====
MAX_FILE_SIZE=52428800
```

### How to generate a strong JWT_SECRET:

**Option A — PowerShell (Windows):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

**Option B — Bash (Linux/Mac):**
```bash
openssl rand -base64 32
```

### For local development (without Docker), also create backend/.env:

```bash
cp .env.example backend/.env
# Edit backend/.env with the same AWS credentials
# Set DB_HOST=localhost if running MySQL locally
```

---

## 6. 🖥️ Run Locally (Without Docker)

### Step 6.1: Setup MySQL

**Option A — If MySQL is installed locally:**
```sql
-- Open MySQL CLI or MySQL Workbench
CREATE DATABASE cloudvault;
CREATE USER 'cloudvault_user'@'localhost' IDENTIFIED BY 'cloudvault_pass';
GRANT ALL PRIVILEGES ON cloudvault.* TO 'cloudvault_user'@'localhost';
FLUSH PRIVILEGES;
```

**Option B — Use Docker just for MySQL:**
```bash
docker run -d \
  --name cloudvault-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=cloudvault \
  -e MYSQL_USER=cloudvault_user \
  -e MYSQL_PASSWORD=cloudvault_pass \
  -p 3306:3306 \
  mysql:8.0
```

### Step 6.2: Start the Backend

```bash
cd backend

# Create backend .env (if not done)
cp ../.env.example .env
# Edit .env → set DB_HOST=localhost and AWS credentials

# Install dependencies
npm install

# Start in dev mode (with auto-reload)
npm run dev
```

You should see:
```
✅ Database tables initialized successfully
🚀 CloudVault server running on port 5000
📡 Health check: http://localhost:5000/health
```

### Step 6.3: Start the Frontend

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

You should see:
```
VITE v6.x.x  ready in XXX ms
➜ Local:   http://localhost:5173/
```

### Step 6.4: Test it!

1. Open **http://localhost:5173** in your browser
2. Click **Sign up** → Create an account
3. Upload a file → It should appear in your S3 bucket
4. Download it → Should open a presigned URL
5. Delete it → Gone from both S3 and the list

---

## 7. 🐳 Run Locally (With Docker)

This is the **easiest method** — one command starts everything.

### Step 7.1: Make sure .env is configured

```bash
cp .env.example .env
# Edit .env with your AWS credentials (Step 5.2)
```

### Step 7.2: Build and Start

```bash
# From project root (where docker-compose.yml is)
docker-compose up --build
```

First run takes 2-5 minutes (downloading images, building containers).

### Step 7.3: Access the App

| Service | URL |
|---|---|
| **Frontend** | http://localhost |
| **Backend API** | http://localhost:5000 |
| **Health Check** | http://localhost:5000/health |
| **MySQL** | localhost:3307 (connect with MySQL Workbench) |

### Useful Docker Commands

```bash
# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Stop and delete all data (database wiped!)
docker-compose down -v

# Rebuild a specific service
docker-compose up -d --build backend

# Check running containers
docker-compose ps
```

---

## 8. ☁️ AWS Setup — EC2 Instance

### Step 8.1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch instance**
2. Settings:
   - **Name**: `CloudVault-Server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: `t2.micro` (Free tier) or `t2.small` (recommended)
   - **Key pair**: Create new → Download the `.pem` file → **Save it securely!**
3. **Network settings** → Edit:
   - **Auto-assign public IP**: Enable
   - **Security group**: Create new with these rules:

| Type | Port | Source | Purpose |
|---|---|---|---|
| SSH | 22 | My IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Frontend |
| Custom TCP | 5000 | 0.0.0.0/0 | Backend API |

4. **Storage**: 20 GB (minimum, increase for more files)
5. Click **Launch instance**

### Step 8.2: Connect to EC2

**Windows (PowerShell):**
```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

**Mac/Linux:**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

> **📝 Find your Public IP**: EC2 Dashboard → Your instance → **Public IPv4 address**

---

## 9. 🚀 Deploy to EC2

### Step 9.1: Clone the Repository

```bash
# On the EC2 instance (after SSH)
git clone https://github.com/abhishekvcet/CloudVault.git
cd CloudVault
```

### Step 9.2: Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in your AWS credentials, JWT secret, and database passwords (same as Step 5.2).

**Save**: `Ctrl + O` → `Enter` → `Ctrl + X`

### Step 9.3: Run the Deploy Script

```bash
chmod +x deploy.sh
./deploy.sh
```

The script automatically:
1. ✅ Updates the system
2. ✅ Installs Docker & Docker Compose
3. ✅ Builds all 3 containers (MySQL, Backend, Frontend)
4. ✅ Starts the application

### Step 9.4: Verify Deployment

```bash
# Check containers are running
docker-compose ps

# Expected output:
# NAME                    STATUS
# cloudvault-mysql        Up (healthy)
# cloudvault-backend      Up
# cloudvault-frontend     Up
```

### Step 9.5: Access Your App! 🎉

Open in your browser:
```
http://<YOUR_EC2_PUBLIC_IP>
```

---

## 10. ✅ Verify Everything Works

### Test Checklist

| # | Test | Expected Result |
|---|---|---|
| 1 | Open `http://<IP>` | Login page loads |
| 2 | Click "Sign up" → Create account | Redirects to dashboard |
| 3 | Upload a small image | Progress bar → File appears in list |
| 4 | Check S3 bucket in AWS Console | File exists under `uploads/<user_id>/` |
| 5 | Click download button | File downloads via presigned URL |
| 6 | Click delete button → Confirm | File removed from list |
| 7 | Check S3 bucket again | File is gone |
| 8 | Log out → Log in again | Files are still there |
| 9 | Open `http://<IP>:5000/health` | Returns `{"status":"ok"}` |

### Test the API Directly (Optional)

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login (save the token)
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | grep -oP '"token":"\K[^"]+')

# List files
curl http://localhost:5000/files \
  -H "Authorization: Bearer $TOKEN"
```

---

## 11. 🔧 Troubleshooting

### ❌ "Database connection refused"
```bash
# Check if MySQL container is running
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# MySQL might still be initializing — wait 30 seconds and retry
```

### ❌ "Access Denied" on S3 upload
- Double-check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
- Verify the IAM user has `AmazonS3FullAccess` policy
- Verify the bucket name and region match

### ❌ Frontend shows blank page
```bash
# Check frontend container logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### ❌ "Port 80 already in use"
```bash
# Find what's using port 80
sudo lsof -i :80

# Or change the frontend port in docker-compose.yml:
# ports:
#   - "8080:80"    ← use 8080 instead
```

### ❌ Cannot SSH into EC2
- Check security group allows SSH (port 22) from your IP
- Make sure you're using the correct `.pem` file
- Try: `ssh -i key.pem -v ubuntu@<IP>` for verbose output

### ❌ "File type not allowed"
Allowed types: Images (JPEG, PNG, GIF, WebP, SVG), Documents (PDF, Word, Excel, PowerPoint, TXT, CSV), Archives (ZIP, RAR, 7z), Media (MP4, MPEG, MP3, WAV), Data (JSON, XML)

### 🔄 How to Update After Code Changes
```bash
# On EC2
cd CloudVault
git pull origin main
docker-compose up -d --build
```

---

## 12. 📋 Checklist Summary

### Before You Start
- [ ] AWS Account created
- [ ] S3 Bucket created (Step 2)
- [ ] S3 CORS configured (Step 2.2)
- [ ] IAM User created with S3 access (Step 3)
- [ ] Access Key ID and Secret saved (Step 3.2)

### For Local Development
- [ ] Node.js ≥ 18 installed
- [ ] MySQL running (local or Docker)
- [ ] `.env` file created with AWS credentials (Step 5)
- [ ] `backend/.env` created for non-Docker setup
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can register, upload, download, and delete files

### For Docker Deployment
- [ ] Docker Desktop installed and running
- [ ] `.env` file configured at project root
- [ ] `docker-compose up --build` succeeds
- [ ] All 3 containers healthy
- [ ] App accessible at http://localhost

### For AWS EC2 Deployment
- [ ] EC2 instance launched (Ubuntu 22.04)
- [ ] Security group: ports 22, 80, 5000 open
- [ ] SSH key (.pem) saved securely
- [ ] Can SSH into instance
- [ ] Repository cloned on EC2
- [ ] `.env` configured on EC2
- [ ] `deploy.sh` executed successfully
- [ ] App accessible at `http://<EC2_PUBLIC_IP>`

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      YOUR BROWSER                       │
│                  http://<EC2_IP>:80                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NGINX (Frontend Container)                 │
│         Serves React build + Proxies /api               │
│                    Port 80                              │
└────────────┬───────────────────────────┬────────────────┘
             │ Static files              │ /auth, /files
             │ (HTML, CSS, JS)           │
             ▼                           ▼
        React SPA              ┌──────────────────┐
                               │  Express Backend  │
                               │    Port 5000      │
                               └───────┬───┬───────┘
                                       │   │
                          ┌────────────┘   └────────────┐
                          ▼                              ▼
                 ┌────────────────┐            ┌────────────────┐
                 │   MySQL 8.0   │            │   Amazon S3    │
                 │  (Docker/RDS) │            │  File Storage  │
                 │   Port 3306   │            │                │
                 └────────────────┘            └────────────────┘
                 Stores: users,                Stores: actual
                 file metadata                 uploaded files
```

---

> **Need help?** Open an issue at https://github.com/abhishekvcet/CloudVault/issues
