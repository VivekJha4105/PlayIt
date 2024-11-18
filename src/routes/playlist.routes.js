import Router from "express";
import {
    createPlaylist,
    deletePlaylist,
    editVideoListOfPlaylist,
    getPlaylistById,
    getUserPlaylists,
    updatePlaylistProfile,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.use(verifyJWT);

//* Creates, Gets and updates(name and description only) playlist/playlists
router
    .route("/")
    .get(getUserPlaylists)
    .post(createPlaylist)
    .patch(updatePlaylistProfile);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(editVideoListOfPlaylist)
    .delete(deletePlaylist);

export default router;
