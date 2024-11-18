import { Router } from "express";
import userRouter from "./user.routes.js";
import videoRouter from "./video.routes.js";
import commentRouter from "./comment.routes.js";
import likeRouter from "./like.routes.js";
import playlistRouter from "./playlist.routes.js";

const router = Router();

router.use("/users", userRouter);

router.use("/videos", videoRouter);

router.use("/comments", commentRouter);

router.use("/likes", likeRouter);

router.use("/playlists", playlistRouter);

export default router;
