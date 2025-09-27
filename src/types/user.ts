export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserPayload {
  id: number;
  userId: number;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}