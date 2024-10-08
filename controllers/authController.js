const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const authService = require('../services/auth');
// const hashingService = require('../services/hashing');
const User = require('../models/userModel'); 
const OTP = require('../models/otpModel'); 
const { validationResult } = require('express-validator');

// Register a new user
const register = async (req, res, next) => {
    const { dateOfBirth, userName,country,email,password } = req.body;
    if(!userName) {
        return res.status(200).json({ message: 'UserName is required !!',success: false,type:'userName' });
    }
    if(!email) {
        return res.status(200).json({ message: 'Email is required !!',success: false,type:'email' });
    }
    if(!password) {
        return res.status(200).json({ message: 'Password is required !!',success: false,type:'password' });
    }
    if(!country) {
        return res.status(200).json({ message: 'Country is required !!',success: false,type:'country' });
    }
    if(!dateOfBirth) {
        return res.status(200).json({ message: 'Date Of Birth is required !!',success: false,type:'dateOfBirth' });
    }
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({ message: 'User already exists',success: false });
        }
        user = new User({ dateOfBirth, userName,country,email,password});
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const otp = (100000 + Math.floor(Math.random() * 900000)).toString();
        const newOTP = new OTP({
            email,
            otp
        });
        await newOTP.save();
        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        if (!response) {
            return res.status(200).json({
                success: false,
                message: 'The OTP is not valid',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Send OTP successfully',
        });

    } catch (err) {
        res.status(500).send({message:'Server error',success:false});
    }
};

// Login user
const login = async (req, res, next) => {

    try{
    const { email, password } = req.body;
    if(!email) {
        return res.status(200).json({ message: 'Email is required !!',success: false,type:'email' });
    }
    if(!password) {
        return res.status(200).json({ message: 'Password is required !!',success: false,type:'password' });
    }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'This Email does not exist',success:false });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({ message: 'Incorrect password',success:false });
        }
        if (user.verified === false) {
            return res.status(200).json({ message: 'not verified',success:false  });
        }
        // Generate JWT token
        const tokenData = { userId: user._id };
        const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '24h' });

        let Role = user.role || "";

        res.status(200).json({ Token: token, Role, message: 'Login successful',success: true });

    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};

// Forget password
const forgetPassword = async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email) {
        return res.status(200).json({ message: 'Please provide email' , success: false});
    }
    if (!otp) {
        return res.status(200).json({ message: 'Please provide OTP', success: false });
    
    }
    if (!newPassword) {
        return res.status(200).json({ message: 'Please provide newPassword' , success: false});
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'User not found.' , success: false});
        }

        const otpRecords = await OTP.findOne({ otp }).sort({ createdAt: -1 }).limit(1);
        console.log(otpRecords);
        if (otpRecords === null) {
            return res.status(200).json({ message: 'Invalid OTP.', success: false });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' ,success:true});
    } catch (error) {
        res.status(200).json({ message: 'Error updating password.', success: false });
    }
};

// Refresh token
const refreshToken = async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
    }

    try {
        // تحقق من التوكين الأصلي
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // تأكد من أن SECRET يتم تحميله من البيئة
        const userId = decoded.userId; // تحقق من أن البيانات التي تحتاجها موجودة في التوكين

        if (!userId) {
            return res.status(401).json({ msg: 'Invalid token data' });
        }

        // قم بإنشاء توكين جديد يتضمن بيانات المستخدم
        const payload = {userId};
        console.log(payload);
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, newToken) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ msg: 'Error signing token' });
            }
            res.status(200).json({ token: newToken });
        });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Invalid token' });
    }
};
module.exports = {
    register,
    login,
    forgetPassword,
    refreshToken
};
