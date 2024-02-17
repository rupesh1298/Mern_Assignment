const express = require('express')
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const router=require('./routes');

app.use(cors({
    origin:["http://localhost:3000"],
    credentials:true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api",router);

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(process.env.PORT, () => {
            console.log(`Server started at port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err.message);
    });
