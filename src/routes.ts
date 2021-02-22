import { Router } from "express";

import CheckStatusController from "./controllers/CheckStatusController";
import SquadController from "./controllers/SquadController";

const router = Router();

// Check Status
router.get("/checkstatus", CheckStatusController.get);

// Squads
router.get("/squad", SquadController.list);
router.get("/squad/:id", SquadController.get);
router.post("/squad", SquadController.create);
router.put("/squad/:id", SquadController.update);
router.delete("/squad/:id", SquadController.remove);

export default router;
