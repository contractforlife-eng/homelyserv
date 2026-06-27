import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

// REGISTER
export const register = async (req, res) => {
  console.log('📝 Registration request received:', req.body);
  try {
    const { email, password, fullName, phone, city, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username from email (remove @ and domain)
    const baseUsername = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 10000);
    const username = `${baseUsername}${randomSuffix}`;

    // Create user with proper role handling
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: username,
        fullName,
        phone: phone || '',
        city: city || '',
        role: role === 'employer' ? 'EMPLOYER' : 'WORKER' // FIXED: Handles both cases
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  console.log('📝 Login request received:', req.body.email);
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if suspended
    if (user.isSuspended) {
      return res.status(403).json({ 
        success: false,
        message: 'Account suspended. Contact support.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        city: true,
        language: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};