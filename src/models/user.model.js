import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            requried: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, //* Helps in searching
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //* url provided by cloudinary
            required: true,
        },
        coverImage: {
            type: String, //* url provided by cloudinary
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required."],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

//* 'pre' hook in middlewares of mongoose. password is hashed before saving
//* Do not use arrow function as context will not be available.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//* middleware 'method' to verify password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//* to generate ACCCESS_TOKEN
userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );

    return token;
};

//* to generate REFERSH_TOKEN
userSchema.methods.generateRefreshToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );

    return token;
};

export const User = mongoose.model("User", userSchema);
