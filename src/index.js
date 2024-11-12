import dotenv from "dotenv";
import dbConnections from "./db/dbConnections.js";
import app from "./app.js";

dotenv.config({ path: "./.env" });

dbConnections()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server listening at PORT: ${process.env.PORT}`);
        });
    })
    .catch((error) => console.log("MongoDb Connection Failed: ", error));
