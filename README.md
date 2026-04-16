# ☁️ CloudVault — Cloud File Storage

A full-stack, cloud-based file storage application (similar to Google Drive) built with **React**, **Node.js/Express**, **AWS S3**, and **MySQL**.

## ✨ Features

- **🔐 User Authentication** — Register/Login with JWT-based sessions
- **📁 File Upload** — Drag-and-drop or click-to-browse with progress bar
- **☁️ S3 Storage** — Files stored securely in Amazon S3
- **⬇️ Presigned Downloads** — Secure, time-limited download URLs
- **🗑️ File Deletion** — Remove files from both S3 and database
- **📊 Dashboard Stats** — Total files, storage used, weekly uploads
- **📱 Responsive UI** — Works on desktop and mobile
- **🐳 Docker Support** — One-command deployment with Docker Compose
- **🔒 Security** — File type validation, size limits, environment-based secrets

---

## 🏗️ Project Structure

```
CC_Project/
├── backend/                # Express.js API Server
│   ├── config/
│   │   ├── db.js           # MySQL connection pool
│   │   └── s3.js           # AWS S3 client config
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── upload.js       # Multer file validation
│   ├── routes/
│   │   ├── authRoutes.js   # Register, Login, Verify
│   │   └── fileRoutes.js   # Upload, List, Download, Delete
│   ├── index.js            # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React + Vite Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── FileList.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── UploadZone.jsx
│   │   ├── api.js          # API client
│   │   ├── App.jsx         # Main application
│   │   ├── index.css       # Design system
│   │   └── main.jsx        # Entry point
│   ├── nginx.conf          # Production reverse proxy
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Full stack orchestration
├── deploy.sh               # EC2 deployment script
├── .env.example            # Environment template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** 8.0+ (or use Docker)
- **AWS Account** with S3 bucket
- **Docker & Docker Compose** (for containerized deployment)

### 1. Clone the project

```bash
git clone <your-repo-url>
cd CC_Project
```

### 2. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Required variables:
| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | S3 bucket region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET` | Your S3 bucket name |
| `JWT_SECRET` | Random secret string for JWT signing |
| `DB_PASSWORD` | MySQL password |

---

## 🖥️ Run Locally (without Docker)

### Backend

```bash
cd backend
cp ../.env.example .env   # Edit with your credentials
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies API calls to backend)

---

## 🐳 Run with Docker Compose

```bash
# From project root
cp .env.example .env
# Edit .env with your AWS credentials

docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | `http://localhost` |
| Backend API | `http://localhost:5000` |
| MySQL | `localhost:3307` |

To stop:
```bash
docker-compose down
```

To stop and remove data:
```bash
docker-compose down -v
```

---

## ☁️ Deploy on AWS EC2

### 1. Launch an EC2 instance

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t2.micro (free tier) or t2.small
- **Security Group**: Open ports `22` (SSH), `80` (HTTP), `5000` (API)

### 2. SSH into your instance

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 3. Clone and deploy

```bash
git clone <your-repo-url>
cd CC_Project
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Install Docker & Docker Compose
2. Prompt you to configure `.env`
3. Build all containers
4. Start the application

Visit `http://<EC2_PUBLIC_IP>` to access CloudVault.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT |
| GET | `/auth/me` | Verify token |

### Files (requires Bearer token)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/files/upload` | Upload file (multipart/form-data) |
| GET | `/files` | List all user's files |
| GET | `/files/download/:id` | Get presigned download URL |
| DELETE | `/files/:id` | Delete file from S3 + DB |

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    user_id INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_uploaded_at (uploaded_at)
);
```

---

## 🔧 AWS S3 Setup

1. Go to **AWS S3** → Create a bucket
2. Disable "Block all public access" (or keep blocked and use presigned URLs — the app uses presigned URLs)
3. Create an **IAM user** with `AmazonS3FullAccess` policy
4. Copy the Access Key ID and Secret Access Key into your `.env`

### Recommended S3 Bucket Policy (optional, for direct access)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAppAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
            },
            "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

---

## 🛡️ Security Notes

- AWS credentials are **never** exposed to the frontend
- Passwords are hashed with **bcrypt** (12 rounds)
- Downloads use **presigned URLs** (expire after 1 hour)
- File uploads are validated by **MIME type** and **size** (50MB max)
- JWT tokens expire after **7 days** (configurable)

---

## 📝 License

MIT
