const express=require('express');
const { signup, login, logout, resetPassword, verifyOtp, getUser, sendEmail } = require('./controller/AuthController');
const { verifyToken } = require('./middlewares/verifyToken');
const { addtoCart, getCart, removeFromCart, increamentQuantity, decreamentQuantity, checkout, clearCart, addBook, editBook, deleteBook, getAllBooks } = require('./controller/FeatureController');

const router=express.Router();

//AUTH ROUTES
router.post('/signup',signup);
router.post("/login",login);
router.get("/logout",logout);
router.put("/reset-password",resetPassword);
router.put("/verify-otp",verifyOtp);
router.get("/get-user",verifyToken, getUser);
router.post('/books', verifyToken,addBook);
router.put('/books/:id',verifyToken, editBook);
router.delete('/books/:id',verifyToken,deleteBook);
router.get('/getbooks',getAllBooks);
//FEATURES ROUTES
router.post("/add-to-cart/:id",addtoCart)
router.get("/get-cart/:id",getCart)
router.delete("/remove-from-cart/:id",removeFromCart)
router.put("/increament-quantity/:id",increamentQuantity)
router.put("/decreament-quantity/:id",decreamentQuantity)
router.get("/checkout",verifyToken,checkout)
router.get("/clear-cart",verifyToken,clearCart)
router.post("/sendemail",sendEmail)
module.exports=router;