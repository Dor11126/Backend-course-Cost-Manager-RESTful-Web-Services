# Cost Manager REST

REST API for managing costs, built for the Asynchronous Server‑Side Development course.  
Stack: Node.js (ESM), Express, MongoDB Atlas (Mongoose), Pino, Jest/Supertest.

---

## Authors
- Emil Davidov
- Dor Cohen

---

## Overview
The service exposes REST endpoints to:
- add users and cost items,
- fetch a monthly grouped report (by category) using a computed/cached pattern,
- get user details and totals,
- list users and logs,
- return team info and a health check.


---

## Prerequisites
- Node.js 20+ (`node -v`)
- MongoDB Atlas cluster (Free M0 is fine)
- (Optional) WebStorm HTTP Client / Postman / curl, MongoDB Compass

---

## Configuration

Create **.env** in the project root (same folder as `package.json`):

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<dbname>?retryWrites=true&w=majority&appName=<ClusterName>
PORT=3000
CATEGORIES=food,health,housing,sports,education
```

Notes:
- Use the SRV string from Atlas → *Connect* → *Drivers (Node.js)* and add the DB name (e.g. `costmanager`).
---

## Install & Run

```bash
npm i
npm run dev     # nodemon
# or
npm start       # node src/server.js
```

On success you should see:
```
Connected to MongoDB
Cost Manager REST listening on port 3000
```

Health check:
```bash
curl http://localhost:3000/health
# -> {"ok":true}
```

---

## Deployment (Production URL)
- **Production base URL:** https://backend-course-cost-manager-restful-web.onrender.com
- Health: https://backend-course-cost-manager-restful-web.onrender.com/health
- About: https://backend-course-cost-manager-restful-web.onrender.com/api/about


---

## API — ready-to-run requests (WebStorm HTTP Client)

Create a file named **cost-manager.http** and paste:

```http
### Health
GET http://localhost:3000/health

### About (team)
GET http://localhost:3000/api/about

### Add user
POST http://localhost:3000/api/add
Content-Type: application/json

{
  "id": 123123,
  "first_name": "Dor",
  "last_name": "Cohen",
  "birthday": "2000-01-02"
}

### Add cost
POST http://localhost:3000/api/add
Content-Type: application/json

{
  "userid": 123123,
  "description": "milk 9",
  "category": "food",
  "sum": 8
}

### Report (current month)
GET http://localhost:3000/api/report?id=123123&year={{$localDatetime rfc3339;YYYY}}&month={{$localDatetime rfc3339;M}}

### Report (past month for cache demo)
GET http://localhost:3000/api/report?id=123123&year=2025&month=6

### User details
GET http://localhost:3000/api/users/123123

### All users
GET http://localhost:3000/api/users

### Logs
GET http://localhost:3000/api/logs
```

---
## API — curl
## Tests

Run tests (requires `MONGODB_URI`):
```bash
npm test
```


---

## Troubleshooting

- **Missing MONGODB_URI** → check `.env` or environment variables.
- **EBADNAME / ENOTFOUND** → SRV host typo; copy exactly from Atlas.
- **Authentication failed** → wrong username/password or IP not allowlisted.
- **Cannot GET /api/add** → this endpoint is **POST** only.
- **Current month not cached** → by design; only past months are cached for reuse.

---

## Notes

- Mongoose schemas live under `models/`.
- Pino writes request and endpoint access logs to the `logs` collection.
- The monthly report implements the computed design pattern.
