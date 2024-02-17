
const Food = require('../models/Food');
const User = require('../models/User');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//ADD TO CART

// const addtoCart = async (req, res) => {
//     const userId = req.params.id;
//     const { id, name, price, image, quantity } = req.body;
//     try {
//         let existingItem = await Food.findOne({ id: id, userId: userId });
//         if (existingItem) {
//             let updatedItem = await Food.findOneAndUpdate({ id, userId },
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
//         let newFood = await Food.create({
//             id,
//             name,
//             price,
//             image,
//             rating,
//             quantity,
//             totalPrice: price * quantity,
//             userId
//         });
//         const savedFood = await newFood.save();
//         let user = await User.findOneAndUpdate({ _id: userId }, { $push: { cartItems: savedFood._id } });
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
        const { id, name, price, qty, rating, img } = req.body;

        // Check if the item is already in the user's cart
        const existingItem = await Food.findOne({ id, userId: userId });

        if (existingItem) {
            // Update the quantity and total price of the existing item
            existingItem.qty += 1;
            existingItem.totalPrice += price * qty;
            await existingItem.save();
        } else {
            // Add the item to the cart if it doesn't exist
            const newItem = new Food({
                id,
                name,
                price,
                qty,
                rating,
                img,
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
        const cartItems = await Food.find({ userId: userId });
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
        let food = await Food.findOneAndDelete({ _id: id });
        if (!food) {
            return res.status(404).json({ success: false, message: "Food not found" }); // Change status code to 404 for not found
        }
        return res.status(200).json({ success: true, message: "Food removed from cart" });
    } catch (error) {
        console.error("Error removing food from cart:", error);
        return res.status(500).json({ success: false, message: "Failed to remove food from cart", error: error.message });
    }
};


// const increamentQuantity = async (req, res) => {
//     const id = req.params.id;
//     try {
//         let food = await Food.findOneAndUpdate({ _id: id }, {
//             $set: {
//                 qty: { $add: ["$qty", 1] },
//                 totalPrice: { $multiply: ["$price", { $add: ["$qty", 1] }] }
//             }
//         },
//             {
//                 upsert: true,
//                 new: true
//             });
//         if (!food) {
//             return res.status(400).json({ success: false, message: "Failed to increament quantity" })
//         }
//         return res.status(200).json({ success: true, message: "Quantity increamented", food })
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message })
//     }
// }

 const increamentQuantity = async (req, res) => {
    const id = req.params.id;
    try {
        let food = await Food.findById(id); // Find the food item by its ID
        if (!food) {
            return res.status(400).json({ message: "Food not found" });
        }
        // Update quantity and total price
        food.qty += 1;
        food.totalPrice = food.price * food.qty;
        await food.save(); // Save the updated food item
        res.status(200).json({ message: "Quantity updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



// const decreamentQuantity = async (req, res) => {
//     const id = req.params.id;
//     try {
//        let food=await Food.findOneAndUpdate({ _id: id ,qty :{$gt:0}}, {
//         $set:{
//             quantity:{$subtract:["$qty",1]},
//             totalPrice:{$multiply:["$totalPrice","$price"]}
//         }
//        },{
//         upsert: true,
//         new: true
//        })
//        if(!food){
//               return res.status(400).json({success:false,message:"Failed to decreament quantity"})
//        }
//        return res.status(200).json({success:true,message:"Quantity decreamented",food})
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message })
//     }
// }
const decreamentQuantity = async (req, res) => {
    const id = req.params.id;
    try {
        let food = await Food.findById(id); // Find the food item by its ID
        if (!food) {
            return res.status(400).json({ message: "Food not found" });
        }
        // Decrement quantity
        food.qty -= 1;
        // Update total price
        food.totalPrice = food.price * food.qty;
        // Save the updated food item
        await food.save();
        
        // Check if quantity is zero after decrementing
        if (food.qty === 0) {
            // If quantity is zero, remove the item from the cart
            await Food.findByIdAndDelete(id);
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
        const cartItems = await Food.find({ userId });
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartItems.map((item) => {
                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: item.name,
                            images: [item.img]
                        },
                        unit_amount: item.price * 100,
                    },
                    quantity: item.qty,
                }
            }),
            success_url: `https://racfood.netlify.app/success`,
            cancel_url: `https://racfood.netlify.app/`
        })
        res.status(200).json({ url: session.url })
    } catch (error) {
        return res.status(500).json({success:false, message: error.message })
    }
}



const clearCart=async(req,res)=>{
    const userId=req.id;
    try {
        const deletedItems=await Food.deleteMany({userId});
        const deletedList=await User.findOneAndUpdate({_id:userId},{cartItems:[]});
        if(!deletedItems){
            return res.status(400).json({success:false,message:"Failed to clear cart"})
        }
        return res.status(200).json({success:true,message:"Order Confirmed"})
    } catch (error) {
        return res.status(500).json({success:false, message: error.message })
    }
}

module.exports = { addtoCart, getCart, removeFromCart, increamentQuantity, decreamentQuantity, checkout,clearCart }