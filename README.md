# Aerchain Project

## Tech Stack
- React (TypeScript)
- Vite
- Node.js (Backend)
- Express
- Database ( MongoDB)
- ESLint

---

## Installation Steps

### 1. Pre-requisites
- Node.js (v18+ recommended)
- npm or yarn
- Database server (MongoDB)


### 2. Project Setup
```bash
# Clone the repository
$ git clone https://github.com/madhan-gunapati/Aerchain.git
$ cd Front-End
```

### 3. Environment Variables

Before running the backend, copy the example environment file and add your API keys and database connection string:

```bash
cd ../Back-End
cp .env.example .env
# Open .env and add your credentials:
# - GEMINI_API_KEY: Your Gemini API key
# - ASSEMBLYAI_API_KEY: Your AssemblyAI API key
# - DATABASE_URL: Your MongoDB connection string
```

### 3. Install Libraries
```bash
# Install dependencies
$ npm install
# or
$ yarn install
```

### 4. Seed Data in the Database
- Ensure your database server is running.
- Run the backend seed script (update with actual command):
```bash
$ cd ../Back-End
$ npm run seed
```

### 5. Run Frontend & Backend Locally
```bash
# Start backend
$ cd ../Back-End
$ node index.js

# Start frontend
$ cd ../Front-End
$ npm run dev
```

---

## API Documentation

| Endpoint         | Method | Path           | Success Response         | Error Response           |
|------------------|--------|----------------|-------------------------|--------------------------|
| Get Tasks        | GET    | /api/tasks     | 200, JSON list of tasks | 400/500, error message   |
| Create Task      | POST   | /api/tasks     | 201, created task       | 400/500, error message   |
| Update Task      | PUT    | /api/tasks/:id | 200, updated task       | 400/404/500, error msg   |
| Delete Task      | DELETE | /api/tasks/:id | 204, no content         | 400/404/500, error msg   |
| Speech-to-Task   | POST   | /stt           | 200, JSON task data     | 400, API key missing<br>500, internal server error |
---

## Voice Input Flow

1. **Frontend** sends audio to the backend `/stt` route.
2. **Backend** sends audio to AssemblyAI API for speech-to-text conversion.
3. The transcribed text is sent to Gemini AI for task extraction (task name, description, etc).
4. The extracted task details are sent back to the frontend for validation.
5. After validation, the task data is sent back to the backend and stored in the database.

This flow enables users to create tasks using voice input, leveraging both AssemblyAI and Gemini AI for accurate and automated task creation.

---

## AI Usage
- Used GitHub Copilot for boilerplate and generic code generation.
- Manually fine-tuned generated code for specific use cases.

### Special Approach in AI Usage
- Carefully understood the problem statement.
- Sketched overall data flow and structure in a notebook.
- Optimized architecture before coding.
- Provided detailed prompts for each module/component.
- Manually approved and committed each module after completion.
- Ensured new modules fit seamlessly with existing ones.

---

## New Things Learnt
- Implementing drag-and-drop elements.
- Building Kan-ban layouts.


