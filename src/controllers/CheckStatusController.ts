import Database from "../lib/Database";
import Controller from "../lib/Controller.interface";
import { Request, Response, NextFunction } from "express";

const db = Database.getConnection();

export default class CheckStatusController implements Controller {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      await db.select(1);
      next({
        statusCode: 200,
      });
    } catch (ex) {
      const { message, stack } = ex;
      next({
        message,
        stack,
        statusCode: 503,
        body: {
          message: "Service Unavailable",
        },
      });
    }
  }
}
