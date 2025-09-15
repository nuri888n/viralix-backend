# Viralix Backend API Documentation

## Overview
This is a REST API for managing social media content across multiple platforms with project-based organization.

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /api/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

#### POST /api/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/me
Get current user information. Requires authentication.

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": null,
  "username": null
}
```

### Projects

#### POST /api/projects
Create a new project. Requires authentication.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description"
}
```

#### GET /api/projects
Get all projects for the authenticated user.

#### GET /api/projects/:projectId
Get a specific project with its accounts and posts.

#### DELETE /api/projects/:projectId
Delete a project and all its associated accounts and posts.

### Social Accounts

#### POST /api/projects/:projectId/accounts
Add a social media account to a project.

**Request Body:**
```json
{
  "platform": "INSTAGRAM",
  "handle": "@myhandle"
}
```

**Valid platforms:** INSTAGRAM, TIKTOK, YOUTUBE, TWITTER

#### GET /api/projects/:projectId/accounts
Get all accounts for a project.

#### DELETE /api/projects/:projectId/accounts/:accountId
Delete a social media account.

### Posts

#### POST /api/projects/:projectId/posts
Create a new post.

**Request Body:**
```json
{
  "caption": "My post content",
  "status": "DRAFT",
  "accountIds": [1, 2]
}
```

**Valid statuses:** DRAFT, SCHEDULED, PUBLISHED

#### GET /api/projects/:projectId/posts
Get all posts for a project.

#### DELETE /api/projects/:projectId/posts/:postId
Delete a post.

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": [] // For validation errors
}
```

Common error codes:
- `validation_failed` - Request validation failed
- `unauthorized` - Invalid or missing authentication
- `email_taken` - Email already registered
- `invalid_credentials` - Wrong email/password
- `project_not_found` - Project doesn't exist or not owned by user
- `account_not_found` - Account doesn't exist
- `post_not_found` - Post doesn't exist
- `rate_limit_exceeded` - Too many requests
- `internal_error` - Server error

## Rate Limiting
The API enforces rate limiting of 100 requests per 15-minute window per IP address.

## Security Features
- CORS protection
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Input validation
- Password hashing with bcrypt
- JWT token authentication