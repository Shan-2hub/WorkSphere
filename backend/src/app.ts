import { prisma } from "./prisma/client.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import commentRoutes from "./modules/comments/comment.routes";
import activityRoutes from "./modules/activity/activity.routes";
import teamRoutes from "./modules/teams/team.routes";
import invitationRoutes, {
  acceptInvitationRouter,
} from "./modules/invitations/invitation.routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/organizations/:organizationId/projects", projectRoutes);
app.use(
  "/api/v1/organizations/:organizationId/projects/:projectId/tasks",
  taskRoutes,
);
app.use(
  "/api/v1/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments",
  commentRoutes,
);
app.use(
  "/api/v1/organizations/:organizationId/activity",
  activityRoutes,
);
app.use(
  "/api/v1/organizations/:organizationId/teams",
  teamRoutes,
);
app.use(
  "/api/v1/organizations/:organizationId/invitations",
  invitationRoutes,
);

app.use("/api/v1/invitations", acceptInvitationRouter);

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      service: "WorkSphere API",
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      service: "WorkSphere API",
      status: "unhealthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

export default app;
