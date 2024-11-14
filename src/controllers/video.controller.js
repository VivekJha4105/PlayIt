import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
