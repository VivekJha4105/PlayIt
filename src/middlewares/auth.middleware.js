import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        //* Extracting ACCESS_TOKEN
        const accessTokenByClient =
            req.cookies.accessToken ||
            req?.headers.authorization?.replace("Bearer ", "");

        if (!accessTokenByClient) {
            throw new ApiError(401, "Unauthorized request.");
        }

        //* Verifying ACCESS_TOKEN
        const payload = jwt.verify(
            accessTokenByClient,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(payload._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access");
    }
});
