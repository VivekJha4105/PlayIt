import { Router } from "express";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    //* Multer middleware to handle file upload
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/token-refresh").post(refreshAccessToken);

//! Authentication
router.route("/login").post(loginUser);

//! Routes needing Authorization

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
