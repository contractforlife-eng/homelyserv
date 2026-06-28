import prisma from '../utils/prisma.js';

// Get all workers
export const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { 
        role: 'WORKER',
        isSuspended: false 
      },
      include: {
        workerProfile: true
      }
    });
    
    // Format the response
    const formattedWorkers = workers.map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      email: worker.email,
      phone: worker.phone || '',
      city: worker.city || '',
      image: worker.image || '',
      isVerified: worker.isVerified || false,
      category: worker.workerProfile?.category || '',
      experienceYears: worker.workerProfile?.experienceYears || 0,
      expectedSalary: worker.workerProfile?.expectedSalary || 0,
      availability: worker.workerProfile?.availability || 'available',
      workType: worker.workerProfile?.workType || 'full-time',
      bio: worker.workerProfile?.bioEn || '',
      skills: worker.workerProfile?.skills || [],
      rating: worker.workerProfile?.ratingAvg || 0,
      reviewCount: worker.workerProfile?.ratingCount || 0,
      profilePhotoUrl: worker.workerProfile?.profilePhotoUrl || '',
      docStatus: worker.workerProfile?.docStatus || 'pending'
    }));
    
    res.json(formattedWorkers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get worker by ID
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await prisma.user.findUnique({
      where: { 
        id: id,
        role: 'WORKER'
      },
      include: {
        workerProfile: {
          include: {
            experiences: true,
            documents: true,
            reviews: {
              include: {
                employer: true
              }
            }
          }
        }
      }
    });
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }
    
    // Format the response
    const formattedWorker = {
      id: worker.id,
      fullName: worker.fullName,
      email: worker.email,
      phone: worker.phone || '',
      city: worker.city || '',
      image: worker.image || '',
      isVerified: worker.isVerified || false,
      createdAt: worker.createdAt,
      category: worker.workerProfile?.category || '',
      experienceYears: worker.workerProfile?.experienceYears || 0,
      expectedSalary: worker.workerProfile?.expectedSalary || 0,
      availability: worker.workerProfile?.availability || 'available',
      workType: worker.workerProfile?.workType || 'full-time',
      bio: worker.workerProfile?.bioEn || '',
      skills: worker.workerProfile?.skills || [],
      rating: worker.workerProfile?.ratingAvg || 0,
      reviewCount: worker.workerProfile?.ratingCount || 0,
      profilePhotoUrl: worker.workerProfile?.profilePhotoUrl || '',
      docStatus: worker.workerProfile?.docStatus || 'pending',
      experiences: worker.workerProfile?.experiences || [],
      documents: worker.workerProfile?.documents || [],
      reviews: worker.workerProfile?.reviews || []
    };
    
    res.json(formattedWorker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Search workers with filters
export const searchWorkers = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      location, 
      minSalary, 
      maxSalary, 
      minRating,
      availability,
      workType,
      experienceMin,
      experienceMax,
      page = 1,
      limit = 20
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build filter conditions
    const where = {
      role: 'WORKER',
      isSuspended: false,
      workerProfile: {
        isVisible: true
      }
    };
    
    // Search by name, email, or skills
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { workerProfile: { skills: { has: q } } }
      ];
    }
    
    // Filter by category
    if (category) {
      where.workerProfile.category = category;
    }
    
    // Filter by location
    if (location) {
      where.city = { contains: location, mode: 'insensitive' };
    }
    
    // Filter by salary range
    if (minSalary || maxSalary) {
      where.workerProfile.expectedSalary = {};
      if (minSalary) {
        where.workerProfile.expectedSalary.gte = parseFloat(minSalary);
      }
      if (maxSalary) {
        where.workerProfile.expectedSalary.lte = parseFloat(maxSalary);
      }
    }
    
    // Filter by rating
    if (minRating) {
      where.workerProfile.ratingAvg = { gte: parseFloat(minRating) };
    }
    
    // Filter by availability
    if (availability && availability !== 'all') {
      where.workerProfile.availability = availability;
    }
    
    // Filter by work type
    if (workType && workType !== 'all') {
      where.workerProfile.workType = workType;
    }
    
    // Filter by experience range
    if (experienceMin || experienceMax) {
      where.workerProfile.experienceYears = {};
      if (experienceMin) {
        where.workerProfile.experienceYears.gte = parseInt(experienceMin);
      }
      if (experienceMax) {
        where.workerProfile.experienceYears.lte = parseInt(experienceMax);
      }
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    // Get workers with pagination
    const workers = await prisma.user.findMany({
      where,
      include: {
        workerProfile: true
      },
      skip,
      take,
      orderBy: {
        workerProfile: {
          ratingAvg: 'desc'
        }
      }
    });
    
    // Format the response
    const formattedWorkers = workers.map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      email: worker.email,
      phone: worker.phone || '',
      city: worker.city || '',
      image: worker.image || '',
      isVerified: worker.isVerified || false,
      category: worker.workerProfile?.category || '',
      experienceYears: worker.workerProfile?.experienceYears || 0,
      expectedSalary: worker.workerProfile?.expectedSalary || 0,
      availability: worker.workerProfile?.availability || 'available',
      workType: worker.workerProfile?.workType || 'full-time',
      bio: worker.workerProfile?.bioEn || '',
      skills: worker.workerProfile?.skills || [],
      rating: worker.workerProfile?.ratingAvg || 0,
      reviewCount: worker.workerProfile?.ratingCount || 0,
      profilePhotoUrl: worker.workerProfile?.profilePhotoUrl || ''
    }));
    
    res.json({
      success: true,
      data: formattedWorkers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching workers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update worker profile
export const updateWorkerProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      category,
      experienceYears,
      expectedSalary,
      availability,
      workType,
      bio,
      skills,
      profilePhotoUrl
    } = req.body;
    
    // Check if user is a worker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true }
    });
    
    if (!user || user.role !== 'WORKER') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update worker profile' 
      });
    }
    
    // Update worker profile
    const updatedWorker = await prisma.workerProfile.update({
      where: { userId: userId },
      data: {
        category: category || undefined,
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        expectedSalary: expectedSalary ? parseFloat(expectedSalary) : undefined,
        availability: availability || undefined,
        workType: workType || undefined,
        bioEn: bio || undefined,
        skills: skills || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined
      }
    });
    
    res.json({
      success: true,
      message: 'Worker profile updated successfully',
      data: updatedWorker
    });
  } catch (error) {
    console.error('Error updating worker profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get top rated workers
export const getTopRatedWorkers = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const workers = await prisma.user.findMany({
      where: {
        role: 'WORKER',
        isSuspended: false,
        workerProfile: {
          isVisible: true,
          ratingAvg: { gt: 0 }
        }
      },
      include: {
        workerProfile: true
      },
      orderBy: {
        workerProfile: {
          ratingAvg: 'desc'
        }
      },
      take: parseInt(limit)
    });
    
    const formattedWorkers = workers.map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      email: worker.email,
      city: worker.city || '',
      image: worker.image || '',
      isVerified: worker.isVerified || false,
      category: worker.workerProfile?.category || '',
      expectedSalary: worker.workerProfile?.expectedSalary || 0,
      availability: worker.workerProfile?.availability || 'available',
      skills: worker.workerProfile?.skills || [],
      rating: worker.workerProfile?.ratingAvg || 0,
      reviewCount: worker.workerProfile?.ratingCount || 0
    }));
    
    res.json(formattedWorkers);
  } catch (error) {
    console.error('Error fetching top rated workers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get worker statistics
export const getWorkerStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const totalWorkers = await prisma.user.count({
      where: { role: 'WORKER' }
    });
    
    const verifiedWorkers = await prisma.user.count({
      where: { 
        role: 'WORKER',
        isVerified: true 
      }
    });
    
    const activeWorkers = await prisma.user.count({
      where: { 
        role: 'WORKER',
        isSuspended: false,
        workerProfile: {
          availability: 'available'
        }
      }
    });
    
    const averageRating = await prisma.workerProfile.aggregate({
      where: {
        ratingAvg: { gt: 0 }
      },
      _avg: {
        ratingAvg: true
      }
    });
    
    res.json({
      success: true,
      data: {
        total: totalWorkers,
        verified: verifiedWorkers,
        active: activeWorkers,
        averageRating: averageRating._avg.ratingAvg || 0
      }
    });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};