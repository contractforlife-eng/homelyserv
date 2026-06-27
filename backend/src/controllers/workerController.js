import prisma from '../utils/prisma.js';

// CREATE OR UPDATE WORKER PROFILE
export const upsertProfile = async (req, res) => {
  try {
    const {
      category, experienceYears, expectedSalary,
      availability, workType, bioAr, bioEn, skills, city
    } = req.body;

    const expYears = parseInt(experienceYears) || 0;
    const salary = parseFloat(expectedSalary) || 0;

    const profile = await prisma.workerProfile.upsert({
      where: { userId: req.userId },
      update: {
        category,
        experienceYears: expYears,
        expectedSalary: salary,
        availability,
        workType,
        bioAr,
        bioEn,
        skills: skills || []
      },
      create: {
        userId: req.userId,
        category,
        experienceYears: expYears,
        expectedSalary: salary,
        availability,
        workType,
        bioAr,
        bioEn,
        skills: skills || []
      }
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: { city }
    });

    res.json({ message: 'Profile saved successfully', profile });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: req.userId },
      include: { user: { select: { fullName: true, email: true, phone: true, city: true } } }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SEARCH WORKERS
export const searchWorkers = async (req, res) => {
  try {
    const { category, city, minSalary, maxSalary, availability } = req.query;

    const filters = { isVisible: true };
    if (category) filters.category = category;
    if (availability) filters.availability = availability;
    if (minSalary || maxSalary) {
      filters.expectedSalary = {};
      if (minSalary) filters.expectedSalary.gte = parseFloat(minSalary);
      if (maxSalary) filters.expectedSalary.lte = parseFloat(maxSalary);
    }

    const workers = await prisma.workerProfile.findMany({
      where: filters,
      include: {
        user: { select: { fullName: true, city: true, phone: true } }
      },
      orderBy: { ratingAvg: 'desc' }
    });

    const results = city
      ? workers.filter(w => w.user.city?.toLowerCase().includes(city.toLowerCase()))
      : workers;

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE WORKER PROFILE
export const getWorkerById = async (req, res) => {
  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true, city: true } },
        experiences: true,
        reviews: {
          include: { employer: { select: { fullName: true } } }
        }
      }
    });
    if (!profile) return res.status(404).json({ message: 'Worker not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};