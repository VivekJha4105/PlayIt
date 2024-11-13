import { Router } from "express";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    changePassword,
    updateAccount,
    updateAvatar,
    updateCoverImage,
    getCurrentUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    //* Multer middleware to handle files upload
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

//! Authentication
router.route("/login").post(loginUser);

//! Token Refresh route for when accessToken has expired thus no auth middleware is needed.
router.route("/token-refresh").post(refreshAccessToken);

//! Below Routes need Authorization

router.route("/current-user").post(verifyJWT, getCurrentUser);

router.route("/password-reset").post(verifyJWT, changePassword);

router.route("/update-profile").post(verifyJWT, updateAccount);

router
    .route("/update-avatar")
    .post(verifyJWT, upload.single("avatar"), updateAvatar);

router
    .route("/update-cover-image")
    .post(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
