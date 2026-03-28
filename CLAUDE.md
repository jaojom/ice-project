# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## เป้าหมายโปรเจกต์

สร้าง **Containerized Business Analytics System** — Backend API สำหรับ Project Monitoring เป็นแบบทดสอบงาน 3 วัน

**สเปกโปรเจกต์:** [docs/Containerized Business Analytics System_C_.pdf](docs/Containerized%20Business%20Analytics%20System_C_.pdf)

## Tech Stack

- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **Infrastructure:** Docker & Docker Compose
- **OS:** Linux/Unix (container ต้องใช้ Linux base image)

## คำสั่งรันระบบ

```bash
# รันทั้งระบบ (API + PostgreSQL) — schema จะ initialize อัตโนมัติ
docker-compose up

# rebuild หลังแก้ code
docker-compose up --build

# หยุดและลบ container
docker-compose down

# รัน API ในเครื่อง (development)
npm install
npm run dev
```

## โครงสร้างโปรเจกต์

```
src/
  routes/          # Express route handlers แยกตาม resource
  controllers/     # Business logic, ดึงข้อมูลจาก services
  services/        # Query PostgreSQL, business rules
  db/              # Connection pool (pg), init SQL scripts
  middlewares/     # Error handler, validation
db/
  init.sql         # Schema + seed ที่ mount เข้า PostgreSQL container
scripts/           # Bash scripts สำหรับ backup, monitor, health-check
```

## Database Schema

4 ตารางหลัก มี FK และ index ที่เหมาะสม:

| ตาราง | คอลัมน์หลัก |
|---|---|
| `users` | id, name, department, email, created_at |
| `projects` | id, name, status, owner_id (FK→users), created_at |
| `tasks` | id, project_id (FK→projects), assigned_to (FK→users), status, progress_pct, department |
| `system_logs` | id, action, entity_type, entity_id, user_id (FK→users), created_at |

Schema ต้อง initialize อัตโนมัติเมื่อสั่ง `docker-compose up` ผ่าน `db/init.sql` ที่ mount เข้า PostgreSQL container ที่ `/docker-entrypoint-initdb.d/`

## API Endpoints ที่ต้องมี

- **CRUD** สำหรับ `projects`, `tasks`, `users`
- **Reports endpoint:** เปอร์เซ็นต์ความคืบหน้าของงานแยกตามแผนก (ใช้ SQL JOIN + GROUP BY + aggregate functions)
- **Data export:** รองรับ JSON และ CSV ผ่าน query param เช่น `?format=csv`

## Bash Scripts ที่ต้องมี (โฟลเดอร์ `scripts/`)

- `backup.sh` — รัน `pg_dump` จากใน/นอก container, บีบอัดด้วย gzip, เก็บไว้ใน volume ที่กำหนด
- `health-check.sh` — ตรวจสอบสถานะ container
- `monitor.sh` — เช็ค CPU/Memory ของ container ที่รันอยู่ (`docker stats`) และจำลอง log rotation

## Deliverables ที่ต้องส่ง

- [ ] `docker-compose.yml` — one-command setup, schema initialize อัตโนมัติ
- [ ] `Dockerfile` — สำหรับ Node.js API (Linux base image)
- [ ] `scripts/backup.sh`, `scripts/monitor.sh`, `scripts/health-check.sh`
- [ ] `README.md` — อธิบายการติดตั้ง + API documentation (หรือ Postman Collection)
- [ ] Source code push ขึ้น GitHub

## เกณฑ์การประเมิน (25% แต่ละข้อ)

1. **Database Schema** — ความถูกต้องของ relation design, FK constraints, การใช้ PostgreSQL features, indexing
2. **Container Quality** — คุณภาพ Docker/Compose config, volumes, networking
3. **Backend Logic** — คุณภาพโค้ด Node.js, การจัดการ error handling
4. **Linux/Unix Skills** — bash scripting, system commands, การควบคุม infrastructure
