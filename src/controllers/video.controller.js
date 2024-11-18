import mongoose from "mongoose";

import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    deleteMultipleFilesFromCloudianry,
    deleteSingleFileFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

export const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!(title || description)) {
        throw new ApiError(400, "Video Title and Description are required.");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is missing");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Video file is missing");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Error while uploading files to cloudinary.");
    }

    const video = await Video.create({
        videoFile: { url: videoFile?.url, publicId: videoFile?.public_id },
        thumbnail: { url: thumbnail?.url, publicId: thumbnail?.public_id },
        title,
        description,
        duration: videoFile?.duration,
        owner: req.user?._id,
    });

    if (!video) {
        throw new ApiError(500, "Error while interacting with Database.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video has been uploaded."));
});

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // TODO: The below aggregation pipeline needs to be consoled and checked later on.
    //! I Hope below pipeline is not an overkill when it comes to amount of querying info.
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(`${videoId}`),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            email: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1,
                            watchHistory: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },
            },
        },
    ]);

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(500, "Error while interacting with database.");
    }

    const newWatchHistory = user.watchHistory.filter(
        (item) => item.toString() !== videoId
    );

    user.watchHistory = newWatchHistory;
    user.watchHistory.unshift(videoId);

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully."));
});

export const updateVideoProfile = asyncHandler(async (req, res) => {
    const { title: newTitle, description: newDescription } = req.body;
    const { videoId } = req.params;

    /**
     * *Make sure client is sending both title and description. If user is not opting to change both then client should send a new and one old entry.
     */
    if (!(newTitle || newDescription || req.file?.path)) {
        throw new ApiError(400, "Details to update are missing.");
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file to update with is missing.");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading files to cloudinary.");
    }

    const videoToDeleteFrom = await Video.findById(videoId);

    if (!videoToDeleteFrom) {
        throw new ApiError(400, "Invalid video ID.");
    }

    await deleteSingleFileFromCloudinary(
        videoToDeleteFrom?.thumbnail?.publicId,
        "image"
    );

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: newTitle,
                description: newDescription,
                thumbnail: {
                    url: thumbnail?.url,
                    publicId: thumbnail?.public_id,
                },
            },
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(400, "Invalid video ID.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video profile updated successfully.")
        );
});

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(
            400,
            "Invalid video ID or video doesn't exists anymore."
        );
    }

    //! ****** Below segment of commented code is not deleting video file even though provided publicId is correct.
    //! ****** Debug it
    //* Deleting Multiple Files from Cloudinary
    // await deleteMultipleFilesFromCloudianry([
    //     video?.videoFile.publicId,
    //     video?.thumbnail.publicId,
    // ]);

    //* Deleting Files individually.

    await deleteSingleFileFromCloudinary(video.thumbnail.publicId, "image");
    await deleteSingleFileFromCloudinary(video.videoFile.publicId, "video");

    //* Deleting video document from the database.
    await Video.findByIdAndDelete(videoId);

    res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully.")
    );
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !"$isPublished",
            },
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(
            400,
            "Invalid Video ID or video does not exists anymore."
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Published status updated successfully."
            )
        );
});
