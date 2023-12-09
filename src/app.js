import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// set the cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// for the json data
app.use(express.json({ limit: "20kb" }));

// data from url
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// for public files
app.use(express.static("public"));

// cookie parser use browser access the cookies
app.use(cookieParser())
export { app };
