# Financial Manager API

This is the API for the Financial Manager application, a tool to help you manage your personal finances.

## ➤ Getting Started

### ➤ Prerequisites

- Node.js
- pnpm
- Docker

### ➤ Installation

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies with `pnpm install`
4. Run `docker-compose up -d` to start the database
5. Run `pnpm prisma:deploy` to run the migrations
6. Run `pnpm dev` to start the development server

## ➤ API Reference

### ➤ Health

- `GET /health` - Check if the server is running

### ➤ Accounts

- `POST /sign-in` - Authenticate a user
- `POST /sign-on` - Register a new user
- `POST /request/password` - Request a code to change user password
- `PATCH /reset/password` - Reset user password

### ➤ Categories

- `GET /categories` - List all categories for the authenticated user
- `GET /categories/active` - List all active categories for the authenticated user
- `POST /categories` - Create a new category
- `PUT /categories/:categoryId` - Update a category
- `DELETE /categories/:categoryId` - Delete a category
- `PATCH /categories/:categoryId/active` - Activate a category
- `PATCH /categories/:categoryId/disable` - Disable a category

### ➤ Transactions

- `GET /transactions` - List all transactions for the authenticated user
- `POST /categories/:categoryId/transactions` - Create a new transaction for a category
- `DELETE /transactions/:transactionId` - Delete a transaction