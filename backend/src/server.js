import express from "express";
const app = express();

app.get("/", (req, res) => {
    res.send("hiiiiiii");
})


const PORT = 3000;
app.listen(PORT, () => {
    console.log("app is listning on port 3000");
})