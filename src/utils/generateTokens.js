import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

export default async function generateTokens(userId) {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error while generating tokens.");
    }
}
