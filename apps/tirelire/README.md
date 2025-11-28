# TireLire

TireLire is a collaborative savings application inspired by the Moroccan tradition of "Dart" (a group money-saving circle). This backend REST API allows users to create groups, contribute money, and manage collaborative savings securely.

## Features

- **User Registration & Login**: Sign up, log in, and manage user profiles.
- **Group Management**: Create, join, and manage savings groups.
- **Contributions**: Make and track contributions to group savings.
- **User Verification**: Upload ID and selfie for verification.
- **Admin & User Roles**: Role-based access for users and admins.
- **API Documentation**: Swagger UI available for easy API exploration.

## Folder Structure

```
src/
  app.js                # Main Express app
  config/               # Configuration files (DB, JWT, etc.)
  controllers/          # Route controllers
  middlewares/          # Express middlewares (auth, error handling)
  models/               # Mongoose models (User, Group, etc.)
  routes/               # Express route definitions
  services/             # Business logic (UserService, PaymentService, etc.)
  utils/                # Utility functions
models/face/            # Face recognition models (for verification)
tests/                  # Jest test files
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for running MongoDB replica set)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/OussamaBenoujja/tirelire.git
   cd tirelire
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Running the App

#### With Docker (Recommended)

1. Start MongoDB replica set and app:
   ```sh
   docker-compose up --build
   ```
2. The API will be available at `http://localhost:3000`.

#### Without Docker

1. Make sure MongoDB is running locally.
2. Start the app:
   ```sh
   npm start
   ```

### API Documentation

- Visit `http://localhost:3000/api-docs` for Swagger UI and API docs.

### Running Tests

- Run all tests with:
  ```sh
  npm test
  ```

## Main Endpoints

- `POST /api/users/register` — Register a new user
- `POST /api/users/login` — User login
- `GET /api/users/profile` — Get user profile
- `PUT /api/users/:id` — Update user
- `POST /api/groups` — Create group
- `POST /api/contributions` — Make a contribution

## Notes
- User verification uses face recognition models in `models/face/`.
- Environment variables are loaded from `.env` (see `.env.example` if available).
- For development, code reloads automatically with `nodemon`.

## License

MIT
