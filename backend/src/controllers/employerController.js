const prisma = require('../lib/prisma');

// CREATE OR UPDATE EMPLOYER PROFILE
const upsertEmployerProfile = async (req, res) => {
  try {
    const {
      companyName, companyLogo, companyPhotos,
      companyWebsite, companySize, industry,
      description, address
    } = req.body;

    console.log('Saving employer profile:', req.body);

    const profile = await prisma.employerProfile.upsert({
      where: { userId: req.userId },
      update: {
        companyName: companyName || '',
        companyLogo: companyLogo || '',
        companyPhotos: companyPhotos || [],
        companyWebsite: companyWebsite || '',
        companySize: companySize || '',
        industry: industry || '',
        description: description || '',
        address: address || ''
      },
      create: {
        userId: req.userId,
        companyName: companyName || '',
        companyLogo: companyLogo || '',
        companyPhotos: companyPhotos || [],
        companyWebsite: companyWebsite || '',
        companySize: companySize || '',
        industry: industry || '',
        description: description || '',
        address: address || ''
      }
    });

    res.json({ message: 'Employer profile saved successfully', profile });
  } catch (error) {
    console.error('Employer profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// GET MY EMPLOYER PROFILE
const getMyEmployerProfile = async (req, res) => {
  try {
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            city: true
          }
        }
      }
    });
    
    console.log('Fetched employer profile:', profile);
    res.json(profile);
  } catch (error) {
    console.error('Get employer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET EMPLOYER PROFILE BY ID
const getEmployerProfileById = async (req, res) => {
  try {
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: req.params.id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            city: true
          }
        }
      }
    });
    if (!profile) return res.status(404).json({ message: 'Employer not found' });
    res.json(profile);
  } catch (error) {
    console.error('Get employer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL EMPLOYER PROFILES (admin only)
const getAllEmployers = async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const profiles = await prisma.employerProfile.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            city: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(profiles);
  } catch (error) {
    console.error('Get all employers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  upsertEmployerProfile,
  getMyEmployerProfile,
  getEmployerProfileById,
  getAllEmployers
};