import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entriesRouter from "./entries";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(entriesRouter);

export default router;
