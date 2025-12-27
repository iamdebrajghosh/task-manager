# MERN Todo App - Setup Guide

## ✅ Environment Files Created

I've created the necessary `.env` files for you:

### Backend `.env` file (`backend/.env`)
- ✅ `MONGO_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - JWT secret key
- ✅ `JWT_REFRESH_SECRET` - JWT refresh secret key
- ✅ `PORT` - Server port (5000)
- ✅ `CLIENT_URL` - Frontend URL for CORS
- ✅ `NODE_ENV` - Environment (development)

### Frontend `.env` file (`frontend/.env`)
- ✅ `REACT_APP_API_BASE_URL` - Backend API URL

## 🔧 Next Steps

### 1. Configure MongoDB Connection

**Option A: Local MongoDB**
- Make sure MongoDB is installed and running on your machine
- The default connection string is: `mongodb://localhost:27017/mern-todo-app`
- If your MongoDB is on a different port, update `MONGO_URI` in `backend/.env`

**Option B: MongoDB Atlas (Cloud)**
- Get your connection string from MongoDB Atlas
- Update `MONGO_URI` in `backend/.env` with your Atlas connection string
- Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### 2. Start the Backend Server

```bash
cd backend
npm install  # If you haven't already
npm start    # or npm run dev for development with nodemon
```

**Check for:**
- ✅ "MongoDB Connected Successfully" message
- ✅ "Server running on port 5000" message
- ❌ If you see "MONGO_URI is not set" or connection errors, check your `.env` file

### 3. Start the Frontend

```bash
cd frontend
npm install  # If you haven't already
npm start    # Starts on http://localhost:3000
```

### 4. Test Registration

1. Open http://localhost:3000/register
2. Fill in the registration form
3. You should see a success message and be redirected to login

## 🐛 Troubleshooting

### Error: "Database connection error"
- **Solution**: Make sure MongoDB is running
  - For local: Start MongoDB service
  - For Atlas: Check your connection string and network access

### Error: "MONGO_URI is not set"
- **Solution**: Check that `backend/.env` file exists and contains `MONGO_URI=...`

### Error: "Request failed with status code 500"
- **Solution**: 
  1. Check backend console for detailed error messages
  2. Verify MongoDB connection
  3. Verify JWT_SECRET is set (has fallback in dev mode)
  4. Check that all required fields are filled in the form

### Error: "Cannot connect to server"
- **Solution**: 
  1. Make sure backend is running on port 5000
  2. Check `REACT_APP_API_BASE_URL` in `frontend/.env`
  3. Verify CORS settings in `backend/server.js`

## 📝 Environment Variables Reference

### Backend Required Variables:
- `MONGO_URI` - **REQUIRED** - MongoDB connection string
- `JWT_SECRET` - Optional (has dev fallback)
- `JWT_REFRESH_SECRET` - Optional (has dev fallback)
- `PORT` - Optional (defaults to 5000)
- `CLIENT_URL` - Optional (defaults to http://localhost:3000)

### Frontend Required Variables:
- `REACT_APP_API_BASE_URL` - Optional (defaults to /api)

## 🔒 Security Notes

⚠️ **Important for Production:**
- Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong, random strings
- Never commit `.env` files to version control
- Use environment-specific values for production

## ✅ Verification Checklist

- [ ] MongoDB is running (local or Atlas)
- [ ] `backend/.env` file exists with `MONGO_URI` set
- [ ] `frontend/.env` file exists
- [ ] Backend server starts without errors
- [ ] Frontend can connect to backend API
- [ ] Registration form works without 500 errors

