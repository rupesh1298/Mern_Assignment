const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
   id:Number,
   name:String,
   price:Number,
   totalPrice:Number,
   qty:Number,
   rating:Number,
   img:String,
   userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
   },
},
{
    timestamps:true
})

const Food=mongoose.model('food',FoodSchema);
module.exports=Food;