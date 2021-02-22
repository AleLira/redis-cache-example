import { Request, Response, NextFunction } from "express";

export default interface Controller {
  get?(req: Request, res: Response, next: NextFunction): void;
  create?(req: Request, res: Response, next: NextFunction): void;
  update?(req: Request, res: Response, next: NextFunction): void;
  remove?(req: Request, res: Response, next: NextFunction): void;
  getById?(req: Request, res: Response, next: NextFunction): void;
}
