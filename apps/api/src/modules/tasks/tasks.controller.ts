import type { RequestHandler } from "express";
import {
  createTaskSchema,
  idSchema,
  updateTaskSchema,
} from "@milestone/shared";
import { requireUserId } from "../../middleware/current-user";
import * as tasksService from "./tasks.service";

// POST /days/:id/tasks
export const createTask: RequestHandler = async (req, res) => {
  const dayId = idSchema.parse(req.params.id);
  const input = createTaskSchema.parse(req.body);
  res
    .status(201)
    .json(await tasksService.createTask(requireUserId(req), dayId, input));
};

// PATCH /tasks/:id
export const updateTask: RequestHandler = async (req, res) => {
  const taskId = idSchema.parse(req.params.id);
  const input = updateTaskSchema.parse(req.body);
  res.json(await tasksService.updateTask(requireUserId(req), taskId, input));
};

// DELETE /tasks/:id
export const deleteTask: RequestHandler = async (req, res) => {
  const taskId = idSchema.parse(req.params.id);
  await tasksService.deleteTask(requireUserId(req), taskId);
  res.status(204).end();
};
