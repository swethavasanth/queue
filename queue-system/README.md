# Digital Queue Management System

An online token and queue management web app. Customers book a token and check their position in the queue; the admin calls the next token and watches the live queue.

**Tech stack:** HTML, CSS, Bootstrap 5, JavaScript, Node.js, Express, MongoDB (Mongoose)

## Features
- Book a token with name, phone and service
- Token numbers restart from 1 every day
- Check token status, "now serving" number and people ahead
- Cancel a waiting token
- Admin page: call next token, live queue table, counters, auto-refresh every 5 s
- Input validation on both front end and back end

## Input validation
| Field | Rule |
|---|---|
| Name | Required, 3–30 letters and spaces only |
| Phone | Required, 10 digits, starts with 6–9 |
| Service | Must be one of the listed services |
| Duplicate | One phone number cannot hold two active tokens |
| Token number (status check) | Must be a positive whole number |

## Folder structure
```
queue-system/
├── server.js            # Express server + MongoDB connection
├── models/Token.js      # Mongoose schema for a token
├── routes/tokenRoutes.js# API routes
└── public/              # Front end
    ├── index.html       # Customer page
    ├── admin.html       # Admin page
    ├── app.js           # Customer page logic
    ├── admin.js         # Admin page logic
    └── style.css
```

## API endpoints
| Method | URL | Purpose |
|---|---|---|
| POST | /api/tokens | Book a token |
| GET | /api/tokens | Get today's queue |
| GET | /api/tokens/:number | Status of one token |
| PUT | /api/tokens/next | Call next token |
| PUT | /api/tokens/:number/cancel | Cancel a waiting token |

## How to run
1. Install **Node.js** (LTS) and **MongoDB Community Server** (install as a service).
2. Open this folder in a terminal and run:
   ```
   npm install
   npm start
   ```
3. Open http://localhost:3000 (customer) and http://localhost:3000/admin.html (admin).
4. To see stored data, open **MongoDB Compass** → connect to `mongodb://127.0.0.1:27017` → database `queueDB` → collection `tokens`.
