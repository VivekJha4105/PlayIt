import mongoose from "mongoose";
import { DB } from "../constants.js";

export default async function dbConnections() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB}`
    );

    console.log(
      ` Database '${DB}' connected and ready to be listened by server. \n DB Host: ${connectionInstance.connection.host}`
    );

    //* Host we are connecting to..
    console.log(``);
  } catch (error) {
    console.log("Error connecting to MONGODB\n ", error);
    process.exit(1);
  }
}
