# FinTrack - High Performance AI Financial Suite

FinTrack is a full-stack application leveraging a high-performance C++ backend (Crow + SQLite) and a modern Next.js frontend with 3D visualization.

## Features
- **Predictive Analytics**: C++ implementation of linear regression for spending forecasts.
- **3D Animated Dashboard**: Immersive UI built with React Three Fiber.
- **AI Receipt Scanner**: integrated file upload and AI-simulated extraction.
- **Data Export**: Export your financial records to CSV format.
- **Budget Tracking**: Real-time visualization of spending vs. budget.
- **Security**: Hardened backend using Prepared Statements to prevent SQL injection.
- **Modern UI**: Full mobile responsiveness and glassmorphism design.

## Prerequisites
- **Docker & Docker Compose** (Recommended)
- OR **Local Environment**:
    - CMake (3.10+)
    - SQLite3 library
    - Node.js (18+)
    - C++ Compiler (GCC/Clang supporting C++17)

## Installation & Running

### Option 1: Docker (Easiest)
Run the entire stack with a single command:
    docker-compose up --build

Access the app at: `http://localhost:3000`

### Option 2: Local Development

#### Backend Setup
1. Install dependencies: `sudo apt-get install libsqlite3-dev libasio-dev`
2. Build Crow: Follow instructions in backend Dockerfile to install Crow locally.
3. Build the project:
    cd backend
    mkdir build && cd build
    cmake ..
    make
    ./fintrack_server

#### Frontend Setup
1. Navigate to directory:
    cd frontend
2. Install dependencies:
    npm install
3. Run development server:
    npm run dev

Access the dashboard at `http://localhost:3000`.

## Architecture Explanation

- **`backend/`**: Contains the C++ server. `main.cpp` handles JSON routing. `analytics.hpp` provides the prediction logic. `database.hpp` abstracts SQLite operations.
- **`frontend/`**: Next.js application. Uses `Tailwind CSS` for styling and `@react-three/fiber` for the pink 3D background sphere.
- **`docker-compose.yml`**: Orchestrates both containers and maps ports for external access.

## Troubleshooting
- **CORS Errors**: If running locally without Docker, ensure `next.config.js` rewrites are correctly pointing to `localhost:8080`.
- **Database Access**: Ensure the directory `backend/db` is writable if running in Docker.
- **Node Dependencies**: If `npm install` fails, ensure you are using Node 18 or higher.
