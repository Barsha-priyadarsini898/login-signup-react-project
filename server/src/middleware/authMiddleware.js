import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_authsphere_modern_2026';

    const decoded = jwt.verify(token, secret);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session not found or account was deleted.',
      });
    }

    // Attach user (excluding password hash) to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged token.',
    });
  }
}
