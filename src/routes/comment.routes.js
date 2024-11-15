import { Router } from "express";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//! Autharization is applied to all routes in this file
router.use(verifyJWT);

router
    .route("/")
    .get(getVideoComments)
    .post(addComment)
    .patch(updateComment)
    .delete(deleteComment);

export default router;
