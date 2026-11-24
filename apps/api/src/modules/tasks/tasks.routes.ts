import { Router } from "express";
import * as tasks from "./tasks.controller";

export const tasksRouter = Router();

tasksRouter.patch("/:id", tasks.updateTask);
tasksRouter.delete("/:id", tasks.deleteTask);
