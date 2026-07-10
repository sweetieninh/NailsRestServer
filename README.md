# NailsRestServer

A production-style Node.js + TypeScript REST API for a nail salon CRM/check-in system.

## Features
- Express + TypeScript
- Mongoose + MongoDB Atlas
- dotenv environment configuration
- Zod request validation
- CORS enabled
- Centralized error handling
- Multi-tenant business-aware queries

## Endpoints
- GET /api/health
- POST /api/checkin/lookup
- POST /api/checkin
- POST /api/customers/register

## Setup
1. Copy .env.example to .env
2. Install dependencies:
   npm install
3. Start the server:
   npm run dev

## Sample curl commands
```bash
curl http://localhost:4010/api/health

curl -X POST http://localhost:4010/api/checkin/lookup \
  -H "Content-Type: application/json" \
  -d '{"businessId":"biz001","storeId":"store001","phone":"5551234567"}'

curl -X POST http://localhost:4010/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"businessId":"biz001","storeId":"store001","customerId":"cust001","phone":"5551234567"}'

curl -X POST http://localhost:4010/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{"businessId":"biz001","storeId":"store001","firstName":"Sally","lastName":"Smith","phone":"5551234567","email":"sally@example.com","birthday":"1990-05-12","allowSMS":true,"allowEmail":false}'
```
