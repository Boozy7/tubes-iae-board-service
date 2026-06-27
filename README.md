# Board Service

Board Service merupakan microservice yang bertanggung jawab untuk mengelola project board pada sistem Video Management. Service ini menggunakan PostgreSQL sebagai database dan RabbitMQ sebagai message broker.

## Teknologi

- Node.js
- Express.js
- PostgreSQL
- RabbitMQ
- Docker Compose

---

## Menjalankan Service

### Install Dependencies

```bash
npm install
```

### Jalankan PostgreSQL dan RabbitMQ

```bash
docker compose up -d
```

### Jalankan Service

```bash
npm run dev
```

Service akan berjalan pada:

```text
http://localhost:3003
```

---

## Environment Variables

Buat file `.env`

```env
PORT=3003

DB_HOST=localhost
DB_PORT=5433
DB_USER=admin_board
DB_PASSWORD=password123
DB_NAME=board_db

RABBITMQ_URL=amqp://localhost
```

---

## Database Schema

### Table: projects

```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PLANNING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# API Endpoints

## Health Check

### GET /

Response:

```json
{
  "message": "Board Service Running",
  "database": {
    "now": "2026-06-01T10:32:37.973Z"
  }
}
```

---

## Create Project

### POST /projects

Request:

```json
{
  "title": "Video Promosi Produk",
  "description": "Editing video Instagram"
}
```

Response:

```json
{
  "message": "Project created successfully",
  "data": {
    "id": 1,
    "title": "Video Promosi Produk",
    "description": "Editing video Instagram",
    "status": "PLANNING"
  }
}
```

---

## Get All Projects

### GET /projects

Response:

```json
{
  "total": 1,
  "data": [
    {
      "id": 1,
      "title": "Video Promosi Produk",
      "description": "Editing video Instagram",
      "status": "PLANNING"
    }
  ]
}
```

---

## Get Project By ID

### GET /projects/:id

Contoh:

```http
GET /projects/1
```

Response:

```json
{
  "id": 1,
  "title": "Video Promosi Produk",
  "description": "Editing video Instagram",
  "status": "PLANNING"
}
```

---

## Update Project Status

### PATCH /projects/:id/status

Request:

```json
{
  "status": "COMPLETED"
}
```

Response:

```json
{
  "message": "Status updated successfully",
  "data": {
    "id": 1,
    "title": "Video Promosi Produk",
    "status": "COMPLETED"
  }
}
```

---

# RabbitMQ Integration

Board Service mengirim notifikasi ke RabbitMQ ketika status project berubah menjadi:

```text
COMPLETED
```

## Queue

```text
video_completed
```

## Message Format

```json
{
  "projectId": 1,
  "title": "Video Promosi Produk",
  "status": "COMPLETED",
  "created_at": "2026-06-01T10:20:09.129Z"
}
```

## Flow

```text
POSTMAN
   │
   ▼
Board Service
   │
   ▼
PostgreSQL
   │
PATCH status = COMPLETED
   │
   ▼
RabbitMQ Queue
(video_completed)
   │
   ▼
Report Service (Consumer)
```

---

## Docker Services

### PostgreSQL

```text
Container : db_board
Port      : 5433
Database  : board_db
```

### RabbitMQ

```text
Container : rabbitmq_board
AMQP Port : 5672
UI Port   : 15672
```

RabbitMQ Management UI:

```text
http://localhost:15672
```

Default Login:

```text
Username: guest
Password: guest
```

---

## Author

Board Service - Tugas Besar Integrasi Aplikasi Enterprise