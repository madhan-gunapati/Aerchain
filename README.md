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
$ git clone <repo-url>
$ cd Front-End
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
$ npm run dev

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
- Enhanced understanding of React component structure and state management.

---

