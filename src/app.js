import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

//* limiting the volume of json incoming
app.use(express.json({ limit: "16kb" }));

//* to read encoded data incoming via url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//* to make public folder available anywhere to store static assets in server
app.use(express.static("public"));

//* to read and write cookies at client and vice versa
app.use(cookieParser());

//* importing router
import router from "./routes/index.routes.js";

//* accessing rotues via router
app.use("/api/v1", router);

export default app;
