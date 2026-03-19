import express from "express";
import cookieParser from "cookie-parser"
import morgan from "morgan"
import authRouter from "./routes/authRouter.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get("/", (req, res) => {
    res.send("hiiiiiii");
})

app.use("/api/auth", authRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log("app is listning on port 3000");
})