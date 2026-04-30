# Team Task Manager

A role-based project and task management web app. Admin users can create projects, manage team members, assign tasks, and delete records. Member users can view assigned work and update task progress.

## Features

- Signup and login with JWT authentication
- Admin and Member role-based access control
- Project creation and team member assignment
- Task creation, assignment, status tracking, and due dates
- Dashboard counts for total, todo, in-progress, done, and overdue tasks
- REST APIs backed by MongoDB Atlas
- Responsive frontend served by the Express backend

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: JWT and bcrypt
- Deployment: Railway

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `backend/.env`:

```bash
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

3. Start the app:

```bash
npm start
```

4. Open:

```txt
http://localhost:3000
```

## API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users`

### Projects

- `GET /api/projects`
- `POST /api/projects` Admin only
- `PATCH /api/projects/:id/members` Admin only
- `DELETE /api/projects/:id` Admin only

### Tasks

- `GET /api/tasks`
- `POST /api/tasks` Admin only
- `PATCH /api/tasks/:id` Admin can update all fields; Member can update assigned task status
- `DELETE /api/tasks/:id` Admin only

## Railway Deployment

1. Push this project to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add environment variables in Railway:

```txt
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

4. Railway will run:

```bash
npm start
```

5. Use the generated Railway domain as the live URL.

## Submission

- Live URL: Add your Railway URL here
- GitHub repo: Add your GitHub repository URL here
