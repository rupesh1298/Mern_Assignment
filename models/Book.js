const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
    id: Number,
    title: String,
    author: String,
    publication_year: Number,
    genre: String,
    price: Number,
    totalPrice: Number,
    qty: Number,
    rating:Number,
    description: String,
    cover_image: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
},
    {
        timestamps: true
    })

const Book = mongoose.model('book', BookSchema);
module.exports = Book;