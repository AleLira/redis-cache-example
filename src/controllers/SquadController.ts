import Controller from "../lib/Controller.interface";
import { Request, Response, NextFunction } from "express";
import Squad from "../models/Squad";

export default class SquadController implements Controller {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, perPage, orderBy } = req.query;
      const squads = await Squad.findPerPage({
        page: Number(page),
        perPage: Number(perPage),
        orderBy: <string>orderBy,
        where: "1 = 1",
      });

      next({
        statusCode: 200,
        body: squads,
      });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const squad = await Squad.findById(Number(id));

      next({
        statusCode: 200,
        body: squad,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const squad = new Squad(req.body);

      await squad.save();

      next({
        statusCode: 201,
        body: squad,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const squad = new Squad({ ...req.body, id });

      await squad.save();

      const newSquad = await Squad.findById(id);

      next({
        statusCode: 200,
        body: newSquad,
      });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const squad = await Squad.findById(Number(id));

      await squad.delete();

      next({
        statusCode: 204,
      });
    } catch (error) {
      next(error);
    }
  }
}
