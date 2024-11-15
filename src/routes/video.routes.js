import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getVideoById,
    togglePublishStatus,
    updateVideoProfile,
    uploadVideo,
} from "../controllers/video.controller.js";

const router = new Router();

//! Autharization is applied to all routes in this file
router.use(verifyJWT);

router.route("/").post(
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    uploadVideo
);

router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideoProfile)
    .delete(deleteVideo);

router.route("/toggle-publish/:videoId").patch(togglePublishStatus);

export default router;
