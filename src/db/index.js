import mongoose from "mongoose";    
import { DB_NAME } from "../constants.js";

const connectDB = async ()  =>  {
    try {
        const connectionString = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Database host: ${connectionString.connection.host}`);
    } catch (error) {
        console.log("Error is MongoDB connection", error);
        process.exit(1)
    }   
}

export default connectDB