import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Parameters are missing.");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(`${videoId}`),
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
                            title: 1,
                            description: 1,
                            views: 1,
                            isPublished: 1,
                        },
                    },
                ],
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
                            fullName: 1,
                            avatar: 1,
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
                owner: {
                    $first: "$owner",
                },
            },
        },
    ]);

    if (!comments) {
        throw new ApiError(
            400,
            "Invalid comment ID or Error while interacting with database."
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments are fetched successfully.")
        );
});

export const addComment = asyncHandler(async (req, res) => {
    const { videoId, content } = req.body;

    if (!(videoId && content)) {
        throw new ApiError(400, "Parameters are missing.");
    }

    const comment = await Comment.create({
        video: videoId,
        content,
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError(500, "Error while interacting with data base.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added Successfully."));
});

export const updateComment = asyncHandler(async (req, res) => {
    //! Comment ID coming from request body. Think hard about the way it would take place in the frontend.
    const { commentId, content } = req.body;

    if (!content) {
        throw new ApiError(400, "Parameters are missing.");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content,
            },
        },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(
            400,
            "Invalid Comment ID or Error while interacting with the database."
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully."));
});

export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Parameters are missing.");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully."));
});
