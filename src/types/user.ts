export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserPayload {
  id: string;
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