import { Request, Response } from "express";
import { activityQuerySchema } from "./activity.validation";
import { getOrganizationActivity } from "./activity.service";

type ActivityRouteParams = {
  organizationId: string;
};

export async function getActivityController(
  req: Request<ActivityRouteParams>,
  res: Response,
) {
  try {
    const query = activityQuerySchema.parse(req.query);

    const result = await getOrganizationActivity(
      req.params.organizationId,
      req.user!.id,
      query,
    );

    return res.status(200).json({
      success: true,
      data: result.activities,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      });
    }

    console.error("Activity feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve activity feed",
    });
  }
}