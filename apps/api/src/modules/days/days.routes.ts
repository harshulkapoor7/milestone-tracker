import { Router } from "express";
import { createTask } from "../tasks/tasks.controller";
import * as days from "./days.controller";

export const daysRouter = Router();

daysRouter.patch("/:id", days.updateDay);
daysRouter.delete("/:id", days.deleteDay);
daysRouter.post("/:id/tasks", createTask); // a new task always belongs to a day
