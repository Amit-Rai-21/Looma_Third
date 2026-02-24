# Looma Schools Dashboard

A full-stack dashboard application for managing and monitoring Looma Education devices across schools in Nepal.

## Overview

This project provides a web-based dashboard for:
- Viewing and managing school information
- Tracking Looma device deployments
- Monitoring device status across schools
- User authentication and role-based access control

## Project Architecture

```
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration, dependencies, security
│   │   ├── db/             # MongoDB connection
│   │   ├── models/         # Beanie document models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js React frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── lib/               # Utilities, API client, DB services
│   └── package.json       # Node.js dependencies
```

## Technology Stack

### Backend
- **FastAPI** - Python web framework
- **Beanie** - MongoDB ODM for Python
- **PyMongo** - MongoDB driver
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Styling
- **Radix UI** - Component library

### Database
- **MongoDB Atlas** - Cloud-hosted MongoDB database
- Database name: `looma-dashboard`
- Primary collection: `schools`

## MongoDB Data Schema

Schools are stored with the following field format in MongoDB:

```json
{
  "_id": ObjectId,
  "Looma_Id": "N0001",
  "District": "Gorkha",
  "Lat long": "28.155, 84.6469",
  "Municipality": "Arjikot RM",
  "Name of the School": "Shree Gyanjyoti Secondary School",
  "Principal_Email": "example@email.com",
  "Principal_name": "Principal Name",
  "Province": "Gandaki",
  "Serial_Number": "r0038",
  "Version": "FEB 2025 7.10",
  "principal_number": 9856071623
}
```

The backend model maps these MongoDB fields to a normalized API response format.

## Environment Variables

Required secrets:
- `MONGODB_URI` - MongoDB connection string

Environment variables (auto-set):
- `MONGODB_DB_NAME` - Database name (default: looma-dashboard)

## Setup and Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- MongoDB Atlas account or local MongoDB instance

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create a .env file in the backend directory
echo "MONGODB_URI=your_mongodb_connection_string" > .env
echo "MONGODB_DB_NAME=looma-dashboard" >> .env
currently using mongodb atlas consisting datas of schools and qr scans

```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
# Activate virtual environment if not already activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`
- API documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

**Terminal 2 - Frontend:**
```bash
cd frontend

# Run the Next.js development server
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000` (or next available port)

### Option 2: Run on Replit

If running on Replit, the platform will automatically:
1. Start the backend workflow on port 8000
2. Start the frontend workflow on port 5000
3. Both services will be accessible through the Replit webview

Simply click the "Run" button in Replit to start both services.

### Production Build

**Backend:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Default Admin Account

An admin user exists in the database:
- Username: `admin`
- Password: Contact system administrator

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Schools
- `GET /schools` - List all schools
- `GET /schools?stats=true` - Get school statistics
- `GET /schools/{id}` - Get school by ID
- `POST /schools` - Create school (admin/staff)
- `PUT /schools/{id}` - Update school (admin/staff)
- `DELETE /schools/{id}` - Delete school (admin/staff)

## Troubleshooting

### Backend Issues
- **MongoDB Connection Error**: Verify your `MONGODB_URI` is correct and MongoDB Atlas allows connections from your IP
- **Port Already in Use**: Change the port with `--port` flag or kill the process using port 8000
- **Module Not Found**: Ensure virtual environment is activated and dependencies are installed

### Frontend Issues
- **API Connection Error**: Verify backend is running and `NEXT_PUBLIC_API_URL` is set correctly
- **Port Already in Use**: Next.js will automatically use the next available port
- **Build Errors**: Delete `.next` folder and `node_modules`, then run `npm install` again

## Recent Changes

- **January 2026**: Updated school model to match existing MongoDB data format
- Configured project for Replit environment
- Added proper CORS settings for development
- Set up workflows for backend (port 8000) and frontend (port 5000)

## User Preferences

- Use MongoDB for data storage
- Connect to existing `looma-dashboard` database
- Maintain compatibility with existing MongoDB schema

## Contributing

When contributing to this project:
1. Follow the existing code style and structure
2. Maintain compatibility with the MongoDB schema
3. Test both backend and frontend changes
4. Update documentation as needed

