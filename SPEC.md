# SPEC.md — Implementation Spec

สเปกนี้ใช้สำหรับสั่ง Claude Code ให้สร้างโปรเจกต์ **Containerized Business Analytics System** ทั้งหมด

---

## Tech Stack

- **Runtime:** Node.js 20 (Alpine)
- **Language:** TypeScript
- **Framework:** Express
- **Database:** PostgreSQL 16
- **ORM/Query:** `pg` (node-postgres) — ใช้ raw SQL ไม่ใช้ ORM
- **Infrastructure:** Docker & Docker Compose

---

## โครงสร้างไฟล์ที่ต้องสร้าง

```
.
├── src/
│   ├── app.ts                  # Express app setup, middleware
│   ├── server.ts               # Entry point, listen port
│   ├── db/
│   │   └── pool.ts             # pg Pool instance จาก env vars
│   ├── types/
│   │   └── index.ts            # Interface: User, Project, Task, SystemLog
│   ├── routes/
│   │   ├── index.ts            # รวม router ทั้งหมด
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── reports.ts
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── tasks.controller.ts
│   │   └── reports.controller.ts
│   ├── services/
│   │   ├── users.service.ts
│   │   ├── projects.service.ts
│   │   ├── tasks.service.ts
│   │   └── reports.service.ts
│   └── middlewares/
│       ├── errorHandler.ts     # Global error handler
│       └── validateId.ts       # ตรวจ UUID param
├── db/
│   └── init.sql                # DDL + indexes
├── scripts/
│   ├── backup.sh
│   ├── health-check.sh
│   └── monitor.sh
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (`db/init.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  department  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'cancelled')),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  status       VARCHAR(50) NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'done')),
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  department   VARCHAR(255) NOT NULL,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100) NOT NULL,
  entity_id    UUID,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_owner_id   ON projects(owner_id);
CREATE INDEX idx_projects_status     ON projects(status);
CREATE INDEX idx_tasks_project_id    ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to   ON tasks(assigned_to);
CREATE INDEX idx_tasks_department    ON tasks(department);
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_entity  ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
```

---

## Environment Variables (`.env.example`)

```
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=analytics_db
DB_USER=postgres
DB_PASSWORD=postgres
```

---

## `package.json` scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

dependencies: `express`, `pg`, `dotenv`
devDependencies: `typescript`, `ts-node-dev`, `@types/express`, `@types/pg`, `@types/node`

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/users` | ดึง users ทั้งหมด |
| GET | `/users/:id` | ดึง user ตาม id |
| POST | `/users` | สร้าง user |
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
| POST | `/projects` | สร้าง project |
| PUT | `/projects/:id` | แก้ไข project |
| DELETE | `/projects/:id` | ลบ project |

**POST /projects body:**
```json
{ "name": "string", "description": "string", "status": "active", "owner_id": "uuid" }
```

### Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | ดึง tasks ทั้งหมด (รองรับ `?project_id=` filter) |
| GET | `/tasks/:id` | ดึง task ตาม id |
| POST | `/tasks` | สร้าง task |
| PUT | `/tasks/:id` | แก้ไข task |
| DELETE | `/tasks/:id` | ลบ task |

**POST /tasks body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "todo",
  "progress_pct": 0,
  "department": "string",
  "project_id": "uuid",
  "assigned_to": "uuid"
}
```

### Reports

| Method | Path | Description |
|---|---|---|
| GET | `/reports/progress-by-department` | เปอร์เซ็นต์ความคืบหน้าแยกตามแผนก |
| GET | `/reports/export?format=json` | export ข้อมูลทั้งหมดเป็น JSON |
| GET | `/reports/export?format=csv` | export ข้อมูลทั้งหมดเป็น CSV |

**GET /reports/progress-by-department — Response:**
```json
[
  {
    "department": "Engineering",
    "total_tasks": 10,
    "avg_progress": 65.5,
    "completed_tasks": 3
  }
]
```

SQL ที่ใช้:
```sql
SELECT
  department,
  COUNT(*)                          AS total_tasks,
  ROUND(AVG(progress_pct), 2)       AS avg_progress,
  COUNT(*) FILTER (WHERE status = 'done') AS completed_tasks
FROM tasks
GROUP BY department
ORDER BY department;
```

**GET /reports/export — CSV format:**
```
id,title,department,status,progress_pct,project_id
...
```

เมื่อ `format=csv` ให้ตั้ง header `Content-Type: text/csv` และ `Content-Disposition: attachment; filename="tasks_export.csv"`

---

## System Logs

ทุก endpoint ที่เป็น POST/PUT/DELETE ให้ insert `system_logs` หลัง operation สำเร็จ:
```ts
await pool.query(
  `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
  [action, entityType, entityId]
);
```

---

## Error Handling

- ทุก controller ให้ใช้ `try/catch` และ `next(err)`
- `errorHandler.ts` middleware จับ error ทั้งหมด ส่ง response:
```json
{ "error": "message" }
```
- 400 สำหรับ validation error
- 404 สำหรับ not found
- 500 สำหรับ server error

---

## `Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## `docker-compose.yml`

```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: analytics_db
      DB_USER: postgres
      DB_PASSWORD: postgres
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: analytics_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  pgdata:
  backups:

networks:
  app-network:
    driver: bridge
```

---

## Bash Scripts

### `scripts/backup.sh`
- รัน `pg_dump` จาก host ผ่าน `docker exec`
- บีบอัดด้วย `gzip`
- บันทึกไฟล์ไว้ที่ `./backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
- ลบ backup ที่เกิน 7 วันออกอัตโนมัติ
- ใช้งาน: `bash scripts/backup.sh`

### `scripts/health-check.sh`
- ตรวจสอบว่า container `api` และ `postgres` กำลังรันอยู่
- ทดสอบ API ด้วย `curl http://localhost:3000/api/health`
- ทดสอบ DB ด้วย `docker exec <postgres-container> pg_isready`
- แสดงผล UP/DOWN พร้อมสี (green/red)
- ใช้งาน: `bash scripts/health-check.sh`

### `scripts/monitor.sh`
- แสดง CPU/Memory ของ container ที่รันอยู่ด้วย `docker stats --no-stream`
- จำลอง log rotation: ถ้าไฟล์ log ใน `./logs/` ใหญ่กว่า 10MB ให้ compress และสร้างไฟล์ใหม่
- ใช้งาน: `bash scripts/monitor.sh`

---

## Health Check Endpoint

เพิ่ม endpoint `GET /api/health` ที่ตอบ:
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## README.md ที่ต้องมี

1. **วิธีรันด้วย Docker** — `docker-compose up --build`
2. **วิธีรัน local** — `npm install && npm run dev`
3. **Environment variables** — อธิบายทุกตัว
4. **API Endpoints** — ตารางสรุปทุก endpoint พร้อม method และ description
5. **Bash Scripts** — วิธีใช้งานแต่ละ script
