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
    getChannelByUsername,
    getWatchHistoryOfUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//* Registers a new user:
router.route("/register").post(
    // Multer middleware to handle files upload
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

//! ==>> Authentication
router.route("/login").post(loginUser);

//! ==>> Token Refresh route for when accessToken has expired thus no auth middleware is needed.
router.route("/token-refresh").post(refreshAccessToken);

//! ==>> Below Routes need Authorization:
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/password-reset").post(verifyJWT, changePassword);

//* Updates either fullName or email, if not both
router.route("/update-profile").patch(verifyJWT, updateAccount);

//* Individual routes to update avatar and cover image separately.
router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
    .route("/update-cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

//* getting info of any one, among many available channels of different users, by username.
//* returns a resonse with subscribers count of that channel as well as subscribed channel count by the loggedin user.
router.route("/channel/:username").get(verifyJWT, getChannelByUsername);

//* Logged in users watch history.
router.route("/watch-history").get(verifyJWT, getWatchHistoryOfUser);

//* getting info of all the channels subscribed by the logged in user.
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
