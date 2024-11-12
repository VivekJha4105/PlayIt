import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import generateTokens from "../utils/generateTokens.js";
import { cookieOptions } from "../utils/cookieOptions.js";

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
        throw new ApiError(400, "Avatar Image is required.");
    }

    //* Creating and saving User in Database
    const user = await User.create({
        ...req.body,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Error while creating user in Database.");
    }

    res.status(201).json(
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
        "-password -refreshToken"
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

    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, "User Logged out successfully."));
});
