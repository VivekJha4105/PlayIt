import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import generateTokens from "../utils/generateTokens.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import mongoose from "mongoose";

export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (!(fullName && email && username && password)) {
        throw new ApiError(400, "All fields are required.");
    }

    const userAlreadyExists = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userAlreadyExists) {
        throw new ApiError(
            400,
            "User with provided email or username already exists."
        );
    }

    //* Saving media file in server disk storage using multure
    // Avatar image is mandatory
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    // To check value for cover image like below cz its not mandatory
    let coverImageLocalPath;
    if (req.files?.coverImage && req.files?.coverImage?.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image is required.");
    }

    //* Pushing locally saved files to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage =
        coverImageLocalPath && (await uploadOnCloudinary(coverImageLocalPath));

    if (!avatar) {
        throw new ApiError(400, "Error While Uploading Avatar to Cloudinary.");
    }

    //* Creating and saving User in Database
    const user = await User.create({
        ...req.body,
        avatar: { url: avatar.url, publicId: avatar.public_id },
        coverImage: { url: coverImage.url, publicId: coverImage.public_id },
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -avatar.publicId -coverImage.publicId"
    );

    if (!createdUser) {
        throw new ApiError(500, "Error while creating user in Database.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully.")
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!((username?.trim() || email?.trim()) && password)) {
        throw new ApiError(400, "Credentials are missing.");
    }

    const registeredUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!registeredUser) {
        throw new ApiError(
            401,
            "User is not registered. Please register and login again."
        );
    }

    //* password verification
    const isPasswordValid = await registeredUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Authentication Failed. Password is incorrect."
        );
    }

    //* generating and saving token with user in DB
    const tokens = await generateTokens(registeredUser._id);

    const user = await User.findById(registeredUser._id).select(
        "-password -refreshToken -avatar.publicId -coverImage.publicId"
    );

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, cookieOptions)
        .cookie("refreshToken", tokens.refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
                "User logged In Successfully."
            )
        );
});

//? refreshToken and accessToken reisuued to user
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const requestingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    if (!requestingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request.");
    }

    const payload = jwt.verify(
        requestingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(payload?._id);
    if (!user) {
        throw new ApiError(400, "Invalid Refresh Token.");
    }

    if (requestingRefreshToken !== user?.refreshToken) {
        throw new ApiError(
            401,
            "Refresh Token is Expired or Used. You need to log in again."
        );
    }

    const tokens = await generateTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, cookieOptions)
        .cookie("refreshToken", tokens.refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
                "Tokens re-issued successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: null },
    });

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User Logged out successfully."));
});

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Incorrect current password.");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully."));
});

//? Update either fullName or email, if not both
export const updateAccount = asyncHandler(async (req, res) => {
    const { fullName: newFullName, email: newEmail } = req.body;

    if (!(newFullName || newEmail)) {
        throw new ApiError(400, "No details provided to update.");
    }

    //! A check to see if new field values are different than the original is set in frontend for now.

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: newFullName,
                email: newEmail,
            },
        },
        { new: true }
    ).select(" -password -refreshToken ");

    if (!user) {
        throw new ApiError(400, "Invalid Refresh Token");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account Information updated successfully."
            )
        );
});

export const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File not found.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "Error While Uploading Avatar to Cloudinary.");
    }

    //! Destroy previously uploaded file on the cloudinary server.
    const delelteAvatarResponse = await deleteFromCloudinary(
        req.user?.avatar?.publicId
    );

    //? Do we want people to stop at result not being okay?
    // if(delelteAvatarResponse?.result !== 'ok') {
    //     throw new ApiError(500, "Error while deleting previous avatar from cloudinary server.")
    // }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                "avatar.url": avatar.url,
                "avatar.publicId": avatar.public_id,
            },
        },
        { new: true }
    ).select(" -password -refreshToken -avatar.publicId -coverImage.publicId ");

    if (!user) {
        throw new ApiError(500, "Error while querying Database.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully."));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file not found.");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
        throw new ApiError(
            500,
            "Error while uploading Cover Image to Cloudinary."
        );
    }

    //! Destroy previously uploaded file on the cloudinary server.
    const delelteCoverImageResponse = await deleteFromCloudinary(
        req.user?.coverImage?.publicId
    );

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                "coverImage.url": coverImage?.url,
                "coverImage.publicId": coverImage?.public_id,
            },
        },
        { new: true }
    ).select(
        " -password -refreshToken -avatar.public_id -coverImage.public_id "
    );
    if (!user) {
        throw new ApiError(500, "Error while querying the Database.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully."));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: req.user },
                "Successfully fetched current user."
            )
        );
});

//? If asked username about, has a channel,
export const getChannelByUsername = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username.trim()) {
        throw new ApiError(400, "Username is missing.");
    }

    const userChannel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedChannelsCount: {
                    $size: "$subscribedTo",
                },
                isSubcribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                "avatar.url": 1,
                "coverImage.url": 1,
                subscribersCount: 1,
                subscribedChannelsCount: 1,
            },
        },
    ]);

    if (!userChannel?.length) {
        throw new ApiError(401, "Channel does not exists.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { channel: userChannel[0] }, "Channel Info")
        );
});

//? Watch history of logged in User
export const getWatchHistoryOfUser = asyncHandler(async (req, res) => {
    //! Mongoose internally doesn't handle Aggregation pipeline.
    //! So, string _id doesn't get converted to mongooes objectId _id.
    //! We need to make that happen explicitly.

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(`${req.user?._id}`),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
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
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            //! rewrites existing fields
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully."
        )
    );
});
