const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
//SIGNUP
 const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" })
        } else {
            const securePassword = await bcrypt.hash(password, 12);
            user = await User.create({ email, password: securePassword, name });
            await user.save();
            return res.status(201).json({ success: true, message: "User created successfully" })
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.staitus(400).json({ success: false, message: "User does not exist" })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 60 * 15),
            secure: true,
            sameSite: "none"
        }).status(200).json({ success: true, message: "Logged in successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

const logout = (req, res) => {
    try {
        res.clearCookie("token").status(200).json({ success: true, message: "Logged out successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

const getUser = async (req, res) => {
    const reqId = req.id;
    try {
        let user = await User.findById(reqId).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }
        return res.status(200).json({ success: true, user, message: "User found successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email } = req.body
        const generateOpt = Math.floor(Math.random() * 10000);
        let user = User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
        const mailoptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Send OTP Successfully 🥳🥳🥳🥳",
            html: `<h1>This is Your genereated OTP :${generateOpt}</h1>`
        }
        transporter.sendMail(mailoptions, async (err, info) => {
            if (err) {
                console.log(err)
            } else {
                await User.findOneAndUpdate({ email }, {
                    $set: {
                        otp: generateOpt,
                    }
                })
                return res.status(200).json({ message: "Otp send successfully" })
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


const verifyOtp = async (req, res) => {
    const { otp, newPassword } = req.body;
    try {
        const securePassword = await bcrypt.hash(newPassword, 12);

        let user = await User.findOneAndUpdate({ otp }, {
            $set: {
                password: securePassword,
                otp: 0
            }
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid Otp" })
        }
        return res.status(200).json({ success: true, message: "Password reset successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// const verifyOtp = async (req, res) => {
//     const { otp, newPassword } = req.body;
//     try {
//         const securePass = await bcrypt.hash(newPassword, 12);
//         let user = await User.findOneAndUpdate({ otp }, {
//             $set: {
//                 password: securePass,
//                 otp: 0
//             }
//         });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid OTP" }); // Add return statement here
//         }
//         return res.status(200).json({ message: "Password has been set Successfully" }); // Move this line inside the else block
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };


const sendEmail = async (req, res) => {
    try {
        const email  = req.body.email
        const{cart}=req.body
        const total=cart.reduce((acc, item) => acc + item.qty * item.price, 0);
        let user = User.findOne({ email })
        if (!user) {
            res.status(400).json({ message: "user not found" })
        }
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
        const mailoptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Invoice of Your Order",
            html: `
            <h1>Thank you for shopping with us</h1>
<table style="border-collapse: collapse; width: 100%;">
    <thead>
        <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
        </tr>
    </thead>
    <tbody>
        ${cart.map(product => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.qty}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${product.price.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${(product.qty * product.price).toFixed(2)}</td>
            </tr>
        `).join('')}
        <tr style="background-color: #f2f2f2;">
            <td colspan="3" style="text-align: right; border: 1px solid #ddd; padding: 8px;">Grand Total:</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${cart.reduce((total, product) => total + (product.qty * product.price), 0).toFixed(2)}</td>
        </tr>
    </tbody>
</table>`
        }
        transporter.sendMail(mailoptions, async (err, info) => {
            if (err) {
                console.log(err)
            } else {
                res.status(200).json({ message: "Email send successfully" })
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports={signup,login,logout,getUser,resetPassword,verifyOtp,sendEmail};