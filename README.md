# MERN Todo App

Task manager built with MongoDB, Express, React, and Node. It focuses on day-to-day productivity with a Pomodoro timer, streaks, daily goals, and progress tracking.

## Features

- Authentication with JWT access tokens and refresh token cookies
- Create, update, complete, and delete tasks
- Pomodoro timer per task with auto-complete on finish
- Daily goals, streak tracking, and “Today’s progress”
- Weekly stats and charts
- Keyboard shortcuts: `Ctrl+K` search, `Shift+N` new task, `Ctrl+G` filter cycle
- File uploads (Multer) and basic dashboard

## Tech Stack

- Backend: Express 5, Mongoose, Helmet, CORS, Cookie-Parser, Rate Limit, Mongo Sanitize, Multer, JWT
- Frontend: React 19 (Create React App), React Router 7, Axios, React Toastify, Recharts, Bootstrap

## Project Structure

```
mern-todo-app/
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── models/
│   ├── config/
│   └── package.json
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

Key files:

- Backend CORS and server boot: `backend/server.js`
- Auth cookie settings: `backend/routes/auth.js`
- Axios client with credentials and token refresh: `frontend/src/axiosInstance.js`

## Local Development

1) Backend

```
cd backend
npm install

# Create .env
PORT=5000
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
# optional (fallbacks to JWT_SECRET if omitted)
JWT_REFRESH_SECRET=your-refresh-secret
# comma-separated list of allowed origins for CORS
CLIENT_URL=http://localhost:3000
NODE_ENV=development

npm run dev
```

2) Frontend

```
cd frontend
npm install

# Create .env (or set in Vercel)
REACT_APP_API_BASE_URL=http://localhost:5000/api

npm start
```

Open `http://localhost:3000`.

## Environment Variables

Backend (`backend/.env`):

- `PORT`: Port for Express (default `5000`)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Access token secret
- `JWT_REFRESH_SECRET`: Refresh token secret (optional)
- `CLIENT_URL`: Comma-separated list of allowed origins (e.g., `http://localhost:3000, https://your-app.vercel.app`)
- `NODE_ENV`: `development` or `production`

Frontend:

- `REACT_APP_API_BASE_URL`: API base (e.g., `http://localhost:5000/api` or `https://<render-service>.onrender.com/api`)

## API Overview

- `POST /api/auth/register` – create account
- `POST /api/auth/login` – login, sets refresh token cookie
- `POST /api/auth/refresh` – get new access/refresh tokens
- `GET /api/auth/me` – current user
- `GET/POST/PUT/DELETE /api/tasks` – task CRUD
- `POST /api/upload` – file uploads

## CORS and Cookies

- Backend allows multiple origins via `CLIENT_URL` (comma-separated). Requests must send credentials.
- Cookies for refresh token are `httpOnly`, `secure` in production, and `sameSite='none'`.
- Axios is configured with `withCredentials: true` and attaches `Authorization` headers using the access token.

## Deployment

### Backend (Render)

- Create a Web Service from your repo root or `backend` directory
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (optional), `CLIENT_URL`, `NODE_ENV=production`
- Start command: `npm start` (backend `package.json` uses `node server.js`)
- Ensure `CLIENT_URL` includes:
  - `https://your-app.vercel.app`
  - `https://your-app-git-<branch>-<org>.vercel.app`
  - `http://localhost:3000` (for local testing)

### Frontend (Vercel)

- Project root: `frontend`
- Build command: `npm run build`
- Output directory: `build`
- Environment variables:
  - `REACT_APP_API_BASE_URL=https://<your-render-service>.onrender.com/api`
  - Set for both Production and Preview
- After saving env vars, trigger a redeploy so CRA injects them

## Troubleshooting

- Network Error on Vercel:
  - Ensure `REACT_APP_API_BASE_URL` is set and a redeploy was triggered
  - Ensure `CLIENT_URL` on the backend lists both Vercel production and preview domains
  - Confirm Axios has `withCredentials: true` (`frontend/src/axiosInstance.js`)
  - Check backend headers allow `Authorization` and `x-auth-token` and that CORS `credentials` is true

- Express wildcard crash (`path-to-regexp`):
  - Avoid invalid wildcard routes; global CORS middleware handles preflight automatically

## Scripts

Backend (`backend/package.json`):

- `npm run dev` – start with nodemon
- `npm start` – production start

Frontend (`frontend/package.json`):

- `npm start` – CRA dev server
- `npm run build` – production build
- `npm test` – run tests

## License

MIT
