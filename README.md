# Containerized Business Analytics System

Backend API สำหรับ Project Monitoring พัฒนาด้วย Node.js + TypeScript + Express + PostgreSQL รันผ่าน Docker

## การติดตั้งและรันระบบ

### วิธีที่ 1: รันด้วย Docker (แนะนำ)

```bash
docker-compose up --build
```

ระบบจะเริ่มทำงานที่ `http://localhost:3000` โดย schema จะ initialize อัตโนมัติ

```bash
# หยุดระบบ
docker-compose down

# หยุดและลบ volumes
docker-compose down -v
```

### วิธีที่ 2: รัน Local (Development)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้างไฟล์ .env
cp .env.example .env

# 3. รัน PostgreSQL ด้วย Docker
docker run -d \
  --name postgres-local \
  -e POSTGRES_DB=analytics_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# 4. รัน server
npm run dev
```

## Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `PORT` | `3000` | Port ของ API server |
| `DB_HOST` | `postgres` | Hostname ของ PostgreSQL |
| `DB_PORT` | `5432` | Port ของ PostgreSQL |
| `DB_NAME` | `analytics_db` | ชื่อ database |
| `DB_USER` | `postgres` | Username |
| `DB_PASSWORD` | `postgres` | Password |

## API Endpoints

Base URL: `http://localhost:3000/api`

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | ตรวจสอบสถานะระบบ |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/users` | ดึง users ทั้งหมด |
| GET | `/users/:id` | ดึง user ตาม id |
| POST | `/users` | สร้าง user ใหม่ |
| PUT | `/users/:id` | แก้ไข user |
| DELETE | `/users/:id` | ลบ user |

**POST /users body:**
```json
{ "name": "string", "email": "string", "department": "string" }
```

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | ดึง projects ทั้งหมด |
| GET | `/projects/:id` | ดึง project ตาม id |
| POST | `/projects` | สร้าง project ใหม่ |
| PUT | `/projects/:id` | แก้ไข project |
| DELETE | `/projects/:id` | ลบ project (cascade ลบ tasks ด้วย) |

**POST /projects body:**
```json
{ "name": "string", "description": "string", "status": "active", "owner_id": "uuid" }
```

### Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | ดึง tasks ทั้งหมด |
| GET | `/tasks?project_id=uuid` | ดึง tasks ของ project นั้น |
| GET | `/tasks/:id` | ดึง task ตาม id |
| POST | `/tasks` | สร้าง task ใหม่ |
| PUT | `/tasks/:id` | แก้ไข task |
| DELETE | `/tasks/:id` | ลบ task |

**POST /tasks body:**
```json
{
  "title": "string",
  "department": "string",
  "project_id": "uuid",
  "description": "string",
  "status": "todo | in_progress | done",
  "progress_pct": 0,
  "assigned_to": "uuid"
}
```

### Reports

| Method | Path | Description |
|---|---|---|
| GET | `/reports/progress-by-department` | เปอร์เซ็นต์ความคืบหน้าแยกตามแผนก |
| GET | `/reports/export?format=json` | Export tasks เป็น JSON |
| GET | `/reports/export?format=csv` | Export tasks เป็น CSV |

**GET /reports/progress-by-department response:**
```json
[
  {
    "department": "Engineering",
    "total_tasks": "5",
    "avg_progress": "72.00",
    "completed_tasks": "2"
  }
]
```

## การรัน Tests

```bash
# เริ่ม test database
npm run test:db:start

# รัน migrations
npm run test:db:migrate

# รัน tests ทั้งหมด
npm test

# รัน integration tests เท่านั้น
npm run test:integration

# รัน unit tests เท่านั้น
npm run test:unit

# รัน tests พร้อม coverage
npm run test:coverage

# หยุด test database
npm run test:db:stop
```

## Bash Scripts

### Backup Database

```bash
bash scripts/backup.sh
```

- รัน `pg_dump` จาก container
- บีบอัดด้วย gzip เก็บไว้ใน `./backups/`
- ลบ backup ที่เกิน 7 วันอัตโนมัติ

### Health Check

```bash
bash scripts/health-check.sh
```

- ตรวจสอบสถานะ container (API + DB)
- ทดสอบ API endpoint
- ตรวจสอบ PostgreSQL readiness

### Monitor Resources

```bash
bash scripts/monitor.sh
```

- แสดง CPU/Memory ของ containers ที่รันอยู่
- Log rotation อัตโนมัติ (ไฟล์ที่ใหญ่กว่า 10MB)
