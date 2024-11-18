import { Router } from "express";
import {
    getAllLikedVideos,
    toggleLikeOnComment,
    toggleLikeOnVideo,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllLikedVideos);
router.route("/video-like").post(toggleLikeOnVideo);
router.route("/comment-like").post(toggleLikeOnComment);

export default router;
