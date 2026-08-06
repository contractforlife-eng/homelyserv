import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { getJwtSecret } from '../config/jwtSecret.js';

// ============================================================
// COUNTRY VALIDATION
// Registration must submit a standardized country:
//   countryCode - ISO 3166-1 alpha-2 (validated against the
//                 runtime's built-in ICU region data, no list
//                 duplication needed)
//   countryName - non-empty display name (max 100 chars)
// Flag emojis are a frontend concern and are never stored.
// ============================================================
const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

const isValidIsoCountryCode = (code) => {
  if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code)) return false;
  try {
    const name = regionDisplayNames.of(code);
    // Unknown codes echo back the code itself or "Unknown Region"
    return Boolean(name) && name !== code && name.toLowerCase() !== 'unknown region';
  } catch {
    return false;
  }
};

// REGISTER
export const register = async (req, res) => {
  console.log('📝 Registration request received:', req.body);
  try {
    const { email, password, fullName, phone, city, role, countryCode, countryName } = req.body;

    // Country is required for new registrations and must be a
    // valid ISO 3166-1 alpha-2 selection (no free-text values).
    const normalizedCountryCode = String(countryCode || '').trim().toUpperCase();
    const normalizedCountryName = String(countryName || '').trim();

    if (!normalizedCountryCode || !normalizedCountryName) {
      return res.status(400).json({
        success: false,
        message: 'Country is required'
      });
    }

    if (!isValidIsoCountryCode(normalizedCountryCode) || normalizedCountryName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid country selection'
      });
    }

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
        countryCode: normalizedCountryCode,
        countryName: normalizedCountryName,
        role: role === 'employer' ? 'EMPLOYER' : 'WORKER',
        image: '' // Initialize with empty image
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    // Return response with image field
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
        city: user.city,
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        image: user.image || ''
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
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    // Return response with image field
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
        city: user.city,
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        image: user.image || ''
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
        countryCode: true,
        countryName: true,
        image: true,
        language: true,
        createdAt: true,
        isVerified: true
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

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, city, image, category, experience, salary, availability, workType, bio, skills } = req.body;
    const userId = req.userId;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        city: city || undefined,
        image: image || undefined
      }
    });

    // Update worker profile if exists
    if (category || experience || salary || availability || workType || bio || skills) {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: userId }
      });

      if (workerProfile) {
        await prisma.workerProfile.update({
          where: { userId: userId },
          data: {
            category: category || undefined,
            experienceYears: experience ? parseInt(experience) : undefined,
            expectedSalary: salary ? parseFloat(salary) : undefined,
            availability: availability || undefined,
            workType: workType || undefined,
            bioEn: bio || undefined,
            skills: skills || undefined
          }
        });
      }
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...userWithoutPassword,
        image: userWithoutPassword.image || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};