import { Router } from "express";
import userRouter from "./user.routes.js";
import videoRouter from "./video.routes.js";

const router = Router();

router.use("/users", userRouter);

router.use("/videos", videoRouter);

export default router;
