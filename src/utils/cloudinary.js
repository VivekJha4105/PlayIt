import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

//* Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadOnCloudinary(localFilePath) {
    try {
        if (!localFilePath) throw new ApiError("File path not available.");

        //* File path being push to cloudinary server
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        return response;
    } catch (error) {
        //* unlinks and removes the locally save file in server
        fs.unlinkSync(localFilePath);

        return null;
    }
}