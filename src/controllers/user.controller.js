import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
