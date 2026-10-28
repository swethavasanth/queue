# Digital Queue Management System

An online token and queue management web app. Users register, log in and book a token, then track their position in the queue. The admin logs in separately to call the next token and manage the live queue.

**Tech stack:** HTML, CSS, Bootstrap 5, JavaScript, Node.js, Express, MongoDB (Mongoose), express-session, bcryptjs

## Features
**User**
- Register with name, email, phone and password
- Log in using the registered email or mobile number and password (persistent session until logout)
- Book a token by choosing a service
- See each token's purpose (selected service), status and people ahead (auto-refresh every 5 s)
- See the current "now serving" token and generate a numbered token for today's queue
- Cancel own waiting token

**Admin (separate login)**
- Call next token
- View today's full queue with pending, serving, completed, cancelled and total counters
- Cancel any waiting token

**Security**
- Passwords stored as bcrypt hashes, never as plain text
- Admin and user sessions are stored separately in MongoDB, so both roles can stay logged in in separate tabs
- Set the `SESSION_SECRET` environment variable to a private, stable value before deployment
- User pages and APIs blocked for admins and vice versa
- Not logged in → redirected to the correct login page

## Default admin account
Created automatically the first time the server starts:

| Email | Password |
|---|---|
| admin@queue.com | admin123 |

## Input validation (front end and back end)
| Field | Rule |
|---|---|
| Name | Required, 3–30 letters and spaces only |
| Email | Required, valid email format, must be unique |
| Phone | Required, 10 digits, starts with 6–9 |
| Password | At least 6 characters with a letter and a number |
| Confirm password | Must match password |
| Service | Must be one of the listed services |
| Duplicate token | A user cannot hold two active tokens at once |

## Folder structure
```
queue-system/
├── server.js               # Express server, sessions, page protection, admin setup
├── models/
│   ├── User.js             # User / admin schema
│   └── Token.js            # Token schema
├── middleware/auth.js      # requireUser / requireAdmin checks
├── routes/
│   ├── authRoutes.js       # Register, login, admin login, logout
│   └── tokenRoutes.js      # Token APIs
└── public/
    ├── login.html          # User login
    ├── register.html       # User registration
    ├── admin-login.html    # Admin login
    ├── user.html           # User dashboard
    ├── admin.html          # Admin dashboard
    ├── auth.js, user.js, admin.js
    └── style.css
```

## API endpoints
| Method | URL | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/register | Public | Create user account |
| POST | /api/auth/login | Public | User login with email or mobile number and password |
| POST | /api/auth/admin-login | Public | Admin login with email and password |
| POST | /api/auth/logout | Logged in | Logout |
| GET | /api/auth/me | Logged in | Current user |
| POST | /api/tokens | User | Book a token |
| GET | /api/tokens/my | User | My tokens today |
| PUT | /api/tokens/my/:number/cancel | User | Cancel my token |
| GET | /api/tokens | Admin | Today's queue |
| PUT | /api/tokens/next | Admin | Call next token |
| PUT | /api/tokens/:number/cancel | Admin | Cancel any token |

## How to run
1. Install **Node.js** (LTS) and **MongoDB Community Server** (install as a service).
2. Open this folder in a terminal and run:
   ```
   npm install
   npm start
   ```
3. User site: http://localhost:3000 — Admin: http://localhost:3000/admin-login.html
4. View data in **MongoDB Compass** → `mongodb://127.0.0.1:27017` → database `queueDB` → collections `users` and `tokens`.
