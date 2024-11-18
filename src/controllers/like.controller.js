import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const toggleLikeOnVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    //* If document already exists(i.e video is liked) then delete the document and return an empty object.
    const videoLikeExists = await Like.find({ video: videoId });

    if (videoLikeExists.length) {
        await Like.findOneAndDelete({
            video: videoId,
        });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Video like status updated successfully.."
                )
            );
    } else {
        const videoLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });

        if (!videoLike) {
            throw new ApiError(500, "Error while interacting with database.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videoLike,
                    "Video like status updated successfully.."
                )
            );
    }
});

export const toggleLikeOnComment = asyncHandler(async (req, res) => {
    const { commentId } = req.body;
    if (!commentId) {
        throw new ApiError(400, "Input Parameters are missing.");
    }

    //* If document already exists(i.e comment is liked) then delete the document and return an empty object.
    const commentLikeExists = await Like.find({ comment: commentId });
    if (commentLikeExists.length) {
        await Like.findOneAndDelete({ comment: commentId });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Comment like status updated successfully."
                )
            );
    }

    const commentLike = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (!commentLike) {
        throw new ApiError(500, "Error while interacting with database.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                commentLike,
                "Comment like status updated successfully.."
            )
        );
});

export const getAllLikedVideos = asyncHandler(async (req, res) => {
    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(`${req.user?._id}`),
                video: { $ne: null },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            owner: 1,
                            isPublished: 1,
                            views: 1,
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
                                        username: 1,
                                        email: 1,
                                        fullName: 1,
                                        avatar: 1,
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
                ],
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
    ]);

    if (!videos) {
        throw new ApiError(500, "Error while interacting with the database.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Liked videos are fetched successfully."
            )
        );
});
