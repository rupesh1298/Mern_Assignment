
const Book = require('../models/Book');
const User = require('../models/User');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//ADD TO CART

// const addtoCart = async (req, res) => {
//     const userId = req.params.id;
//     const { id, name, price, image, quantity } = req.body;
//     try {
//         let existingItem = await Book.findOne({ id: id, userId: userId });
//         if (existingItem) {
//             let updatedItem = await Book.findOneAndUpdate({ id, userId },
//                 {
//                     $set:
//                     {
//                         quantity: existingItem.quantity + 1,
//                         totalPrice: existingItem.price * (existingItem.quantity + 1)
//                     }
//                 }, {
//                 upsert: true,
//                 new: true
//             });
//             if (!updatedItem) {
//                 return res.status(400).json({ success: false, message: "failed added to cart" });
//             }
//             return res.status(200).json({ success: true, message: "added to cart" });
//         }
//         let newBook = await Book.create({
//             id,
//             name,
//             price,
//             image,
//             rating,
//             quantity,
//             totalPrice: price * quantity,
//             userId
//         });
//         const savedBook = await newBook.save();
//         let user = await User.findOneAndUpdate({ _id: userId }, { $push: { cartItems: savedBook._id } });
//         if (!user) {
//             return res.status(400).json({ success: false, message: "failed added to cart" });
//         }
//         return res.status(200).json({ success: true, message: "added to cart" });

//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message })
//     }
// }
const addtoCart = async (req, res) => {

    try {
        const userId  = req.params.id;
        console.log(userId);
        const findUser = await User.findById(userId);
        const { id, title, price, qty, rating, cover_image } = req.body;

        // Check if the item is already in the user's cart
        const existingItem = await Book.findOne({ id, userId: userId });

        if (existingItem) {
            // Update the quantity and total price of the existing item
            existingItem.qty += 1;
            existingItem.totalPrice += price * qty;
            await existingItem.save();
        } else {
            // Add the item to the cart if it doesn't exist
            const newItem = new Book({
                id,
                title,
                price,
                qty,
                rating,
                cover_image,
                userId: userId,
                totalPrice: price * qty,
            });
            const newData = await newItem.save();

          //  Push the newly added item's ID to the user's cartItems array
            await User.findByIdAndUpdate(userId, { $push: { cartItems: newItem._id } });
            await findUser.save();
        }
        res.status(200).json({ message: "Item added to cart successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add item to cart", error: error.message });
    }
}

const getCart = async (req, res) => {
    const userId = req.params.id
    try {
        const cartItems = await Book.find({ userId: userId });
        if (!cartItems) {
            return res.status(400).json({ success: false, message: "No items found" });
        }
        return res.status(200).json({ success: true, cartItems });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


const removeFromCart = async (req, res) => {
    const id = req.params.id;
    try {
        let book = await Book.findOneAndDelete({ _id: id });
        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" }); // Change status code to 404 for not found
        }
        return res.status(200).json({ success: true, message: "Book removed from cart" });
    } catch (error) {
        console.error("Error removing Book from cart:", error);
        return res.status(500).json({ success: false, message: "Failed to remove Book from cart", error: error.message });
    }
};


 const increamentQuantity = async (req, res) => {
    const id = req.params.id;
    try {
        let book = await Book.findById(id); // Find the Book item by its ID
        if (!book) {
            return res.status(400).json({ message: "Book not found" });
        }
        // Update quantity and total price
        book.qty += 1;
        book.totalPrice = book.price * book.qty;
        await book.save(); // Save the updated Book item
        res.status(200).json({ message: "Quantity updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



// const decreamentQuantity = async (req, res) => {
//     const id = req.params.id;
//     try {
//        let Book=await Book.findOneAndUpdate({ _id: id ,qty :{$gt:0}}, {
//         $set:{
//             quantity:{$subtract:["$qty",1]},
//             totalPrice:{$multiply:["$totalPrice","$price"]}
//         }
//        },{
//         upsert: true,
//         new: true
//        })
//        if(!Book){
//               return res.status(400).json({success:false,message:"Failed to decreament quantity"})
//        }
//        return res.status(200).json({success:true,message:"Quantity decreamented",Book})
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message })
//     }
// }
const decreamentQuantity = async (req, res) => {
    const id = req.params.id;
    try {
        let book = await Book.findById(id); // Find the Book item by its ID
        if (!book) {
            return res.status(400).json({ message: "Book not found" });
        }
        // Decrement quantity
        book.qty -= 1;
        // Update total price
        book.totalPrice = book.price * book.qty;
        // Save the updated book item
        await book.save();
        
        // Check if quantity is zero after decrementing
        if (book.qty === 0) {
            // If quantity is zero, remove the item from the cart
            await Book.findByIdAndDelete(id);
        }

        res.status(200).json({ message: "Quantity updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


 const checkout = async (req, res) => {
    //middleware se
    const userId = req.id
    try {
        const cartItems = await Book.find({ userId });
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartItems.map((item) => {
                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: item.title,
                            images: [item.cover_image]
                        },
                        unit_amount: item.price * 100,
                    },
                    quantity: item.qty,
                }
            }),
            success_url: `http://localhost:3000/success`,
            cancel_url: `http://localhost:3000/cancel`
        })
        res.status(200).json({ url: session.url })
    } catch (error) {
        return res.status(500).json({success:false, message: error.message })
    }
}



const clearCart=async(req,res)=>{
    const userId=req.id;
    try {
        const deletedItems=await Book.deleteMany({userId});
        const deletedList=await User.findOneAndUpdate({_id:userId},{cartItems:[]});
        if(!deletedItems){
            return res.status(400).json({success:false,message:"Failed to clear cart"})
        }
        return res.status(200).json({success:true,message:"Order Confirmed"})
    } catch (error) {
        return res.status(500).json({success:false, message: error.message })
    }
}

const addBook = async (req, res) => {
    const{id,title,author,publication_year,genre,price,qty,rating,description,cover_image}=req.body;
    try {
        const data = new Book(req.body);
        const newBook=await data.save();
        console.log(newBook)
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const editBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await Book.findByIdAndDelete(id);
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllBooks=async(req,res)=>{
    try {
        const books=await Book.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
}
module.exports = { addtoCart, getCart, removeFromCart, increamentQuantity, decreamentQuantity, checkout,clearCart,addBook,editBook,deleteBook,getAllBooks }