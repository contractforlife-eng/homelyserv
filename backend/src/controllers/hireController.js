const prisma = require('../utils/prisma');

// SEND JOB OFFER
const sendOffer = async (req, res) => {
  try {
    const { workerId, agreedSalary, startDate } = req.body;

    const salary = parseFloat(agreedSalary);
    const commission = salary * 0.065;
    const vat = commission * 0.14;
    const total = commission + vat;

    const reference = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const hire = await prisma.hire.create({
      data: {
        workerId,
        employerId: req.userId,
        agreedSalary: salary,
        commissionAmount: commission,
        vatAmount: vat,
        totalDue: total,
        paymentReference: reference,
        startDate: startDate ? new Date(startDate) : null,
        status: 'offer_sent'
      }
    });

    res.status(201).json({ message: 'Offer sent successfully', hire });
  } catch (error) {
    console.error('Hire error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY HIRES (employer or worker)
const getMyHires = async (req, res) => {
  try {
    let hires;

    if (req.userRole === 'EMPLOYER') {
      hires = await prisma.hire.findMany({
        where: { employerId: req.userId },
        include: {
          worker: {
            include: { user: { select: { fullName: true, phone: true, city: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const profile = await prisma.workerProfile.findUnique({ where: { userId: req.userId } });
      if (!profile) return res.json([]);
      hires = await prisma.hire.findMany({
        where: { workerId: profile.id },
        include: {
          employer: { select: { fullName: true, phone: true, city: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(hires);
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL HIRES (admin only)
const getAllHires = async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const hires = await prisma.hire.findMany({
      include: {
        worker: {
          include: { user: { select: { fullName: true, phone: true, city: true } } }
        },
        employer: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(hires);
  } catch (error) {
    console.error('Get all hires error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CONFIRM PAYMENT (admin)
const confirmPayment = async (req, res) => {
  try {
    const hire = await prisma.hire.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'confirmed', status: 'active' }
    });
    res.json({ message: 'Payment confirmed', hire });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// SUBMIT PAYMENT PROOF
const submitPayment = async (req, res) => {
  try {
    const { paymentMethod, paymentProofUrl } = req.body;
    const hire = await prisma.hire.update({
      where: { id: req.params.id },
      data: { 
        paymentMethod, 
        paymentProofUrl, 
        paymentStatus: 'pending' 
      }
    });
    res.json({ message: 'Payment submitted', hire });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE TEST HIRE (for testing purposes)
const createTestHire = async (req, res) => {
  try {
    // Find a worker
    const worker = await prisma.workerProfile.findFirst({
      include: { user: true }
    });

    // Find an employer
    const employer = await prisma.user.findFirst({
      where: { role: 'EMPLOYER' }
    });

    if (!worker || !employer) {
      return res.status(400).json({ 
        message: 'Need at least one worker and one employer. Please register both first.',
        details: { workerFound: !!worker, employerFound: !!employer }
      });
    }

    // Create sample hires
    const sampleHires = [
      {
        workerId: worker.id,
        employerId: employer.id,
        agreedSalary: 5000,
        commissionAmount: 325,
        vatAmount: 45.5,
        totalDue: 370.5,
        paymentReference: `HS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'active',
        paymentStatus: 'confirmed',
        paymentMethod: 'InstaPay'
      },
      {
        workerId: worker.id,
        employerId: employer.id,
        agreedSalary: 3500,
        commissionAmount: 227.5,
        vatAmount: 31.85,
        totalDue: 259.35,
        paymentReference: `HS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'Vodafone Cash'
      },
      {
        workerId: worker.id,
        employerId: employer.id,
        agreedSalary: 7000,
        commissionAmount: 455,
        vatAmount: 63.7,
        totalDue: 518.7,
        paymentReference: `HS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'active',
        paymentStatus: 'confirmed',
        paymentMethod: 'Bank Transfer'
      }
    ];

    // Check if hires already exist for this worker
    const existingHires = await prisma.hire.findMany({
      where: { workerId: worker.id }
    });

    let createdHires = [];
    if (existingHires.length === 0) {
      // Create sample hires
      for (const hireData of sampleHires) {
        const hire = await prisma.hire.create({ data: hireData });
        createdHires.push(hire);
      }
      res.json({ 
        message: 'Test hires created successfully!', 
        hires: createdHires,
        count: createdHires.length
      });
    } else {
      res.json({ 
        message: 'Hires already exist for this worker', 
        existingHires: existingHires,
        count: existingHires.length
      });
    }

  } catch (error) {
    console.error('Create test hire error:', error);
    res.status(500).json({ 
      message: 'Server error: ' + error.message,
      error: error.message 
    });
  }
};

module.exports = { 
  sendOffer, 
  getMyHires, 
  getAllHires,
  confirmPayment, 
  submitPayment,
  createTestHire
};