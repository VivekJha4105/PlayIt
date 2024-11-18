import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!(name && description)) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    const isPlaylistExists = await Playlist.findOne({
        name,
        owner: req.user?._id,
    });

    if (isPlaylistExists) {
        throw new ApiError(
            400,
            `Playlist with name: ${name}, already exists. Please try another name.`
        );
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "Error while interacting with database.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, playlist, "Playlist is successfully created.")
        );
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
    const playlists = await Playlist.find({ owner: req.user?._id });
    if (!playlists) {
        throw new ApiError(500, "Error while interacting with database.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists are fetched."));
});

export const updatePlaylistProfile = asyncHandler(async (req, res) => {
    const { name, description, playlistId } = req.body;
    if (!(name && description && playlistId)) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(`${playlistId}`),
            owner: new mongoose.Types.ObjectId(`${req.user?._id}`),
        },
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );
    if (!playlist) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully."));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!playlistId) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: req.user?._id,
    });
    if (!playlist) {
        throw new ApiError("Invalid Playlist ID.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist has been fetched successfully."
            )
        );
});

export const editVideoListOfPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { videoId, updateType } = req.body;

    if (!(playlistId && videoId && updateType)) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    let updatedPlaylist;
    if (updateType === "add") {
        updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: {
                    videos: videoId,
                },
            },
            { new: true }
        );
    } else {
        updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: {
                    videos: {
                        $in: [videoId],
                    },
                },
            },
            { new: true }
        );
    }

    if (!updatedPlaylist) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist's video list updated successfully."
            )
        );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    const deleteResponse = await Playlist.findByIdAndDelete(playlistId);
    if (!deleteResponse) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist Deleted Successfully."));
});
