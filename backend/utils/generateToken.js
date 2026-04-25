// backend/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    // 1. Create the token using the user's MongoDB _id
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    // 2. Send it as an HTTP-only cookie
    res.cookie('jwt', token, {
        httpOnly: true, // Prevents Javascript from reading it (Protects against hackers!)
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict', // Prevents cross-site attacks
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export default generateToken;
