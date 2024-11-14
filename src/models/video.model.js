import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            url: {
                type: String, //* Cloudinary url
                required: true,
            },
            publicId: {
                type: String, //* From cloudinary upload response object
                required: true,
            },
        },
        thumbnail: {
            url: {
                type: String, //* Cloudinary url
                required: true,
            },
            publicId: {
                type: String, //* From cloudinary upload response object
                required: true,
            },
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, //* Cloudinary provides info along with video url
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

//* Can provide middlewares and plugins like below:
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
