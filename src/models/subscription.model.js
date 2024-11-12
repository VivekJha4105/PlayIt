import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        //* user who owns the Channel
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
