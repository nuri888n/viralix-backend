import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    "https://app.viralix.ai",
    "http://localhost:5173",
    ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : [])
  ],
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));

// Routes
app.use("/api/auth", authRoutes);

// Simple test route directly in index.ts
app.get("/api/auth/test", (_req: Request, res: Response) => {
  res.json({
    message: "Test route works!",
    status: "success",
    timestamp: new Date().toISOString(),
    note: "This route is defined directly in index.ts"
  });
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Basic API endpoint
app.get("/api/status", (_req: Request, res: Response) => {
  res.json({
    message: "Viralix Backend API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// Placeholder agents endpoint
app.post("/api/agents", (_req: Request, res: Response) => {
  res.json({
    message: "Agents temporarily disabled",
    status: "disabled",
    note: "AI agent functionality will be added after basic deployment is working"
  });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to Viralix Backend",
    endpoints: {
      health: "/health",
      status: "/api/status",
      agents: "/api/agents (POST)",
      auth: {
        register: "/api/auth/register (POST)",
        login: "/api/auth/login (POST)",
        me: "/api/auth/me (GET)"
      }
    }
  });
});

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((error: Error, _req: Request, res: Response, _next: any) => {
  console.error("Server Error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Viralix Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
app.get("/debug", (_req, res) => {
  res.json({
    message: "Debug endpoint",
    routes: app._router.stack.filter((r: any) => r.route).map((r: any) => r.route.path),
    timestamp: new Date().toISOString()
  });
});
