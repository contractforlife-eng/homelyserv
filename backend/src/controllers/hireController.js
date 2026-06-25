const prisma = require('../utils/prisma');

// SEND JOB OFFER
const sendOffer = async (req, res) => {
  try {
    const { workerId, agreedSalary, startDate } = req.body;

    console.log('Received offer:', { workerId, agreedSalary, startDate });
    console.log('User ID:', req.userId);

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
        status: 'pending',
        paymentStatus: 'pending',
        workerAccepted: false,
        employerAccepted: true,
        contactShared: false
      }
    });

    res.status(201).json({
      message: 'Offer sent successfully! Waiting for worker to accept.',
      hire
    });
  } catch (error) {
    console.error('Hire error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
};

// WORKER ACCEPTS OFFER
const acceptOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const hire = await prisma.hire.findUnique({
      where: { id },
      include: { worker: true }
    });

    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    // Check if this hire belongs to the worker
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!workerProfile || hire.workerId !== workerProfile.id) {
      return res.status(403).json({ message: 'Not authorized to accept this offer' });
    }

    if (hire.status !== 'pending') {
      return res.status(400).json({ message: 'This offer is no longer available' });
    }

    const updated = await prisma.hire.update({
      where: { id },
      data: {
        status: 'accepted',
        workerAccepted: true
      }
    });

    res.json({
      message: 'Offer accepted! Please complete the payment to reveal contact details.',
      hire: updated,
      requiresPayment: true
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// WORKER DECLINES OFFER
const declineOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const hire = await prisma.hire.findUnique({
      where: { id },
      include: { worker: true }
    });

    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!workerProfile || hire.workerId !== workerProfile.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await prisma.hire.update({
      where: { id },
      data: {
        status: 'rejected',
        workerAccepted: false
      }
    });

    res.json({ message: 'Offer declined', hire: updated });
  } catch (error) {
    console.error('Decline offer error:', error);
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
            include: {
              user: {
                select: {
                  fullName: true,
                  phone: true,
                  city: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const profile = await prisma.workerProfile.findUnique({
        where: { userId: req.userId }
      });
      if (!profile) return res.json([]);
      hires = await prisma.hire.findMany({
        where: { workerId: profile.id },
        include: {
          employer: {
            select: {
              fullName: true,
              phone: true,
              city: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Hide contact info if payment not confirmed
    const sanitizedHires = hires.map(hire => {
      const sanitized = { ...hire };

      // Only show contact info if payment is confirmed AND status is active
      const canShowContact = hire.paymentStatus === 'confirmed' && hire.status === 'active';

      if (!canShowContact) {
        if (sanitized.worker?.user) {
          sanitized.worker.user.phone = '🔒 Hidden until payment';
          sanitized.worker.user.email = '🔒 Hidden until payment';
        }
        if (sanitized.employer) {
          sanitized.employer.phone = '🔒 Hidden until payment';
          sanitized.employer.email = '🔒 Hidden until payment';
        }
      }

      return sanitized;
    });

    res.json(sanitizedHires);
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL HIRES (admin only)
const getAllHires = async (req, res) => {
  try {
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
      data: {
        paymentStatus: 'confirmed',
        status: 'active',
        contactShared: true
      }
    });
    res.json({
      message: 'Payment confirmed! Contact details are now shared.',
      hire
    });
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

// CREATE TEST HIRE
const createTestHire = async (req, res) => {
  try {
    const worker = await prisma.workerProfile.findFirst({
      include: { user: true }
    });

    const employer = await prisma.user.findFirst({
      where: { role: 'EMPLOYER' }
    });

    if (!worker || !employer) {
      return res.status(400).json({
        message: 'Need at least one worker and one employer. Please register both first.'
      });
    }

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
        paymentMethod: 'InstaPay',
        workerAccepted: true,
        employerAccepted: true,
        contactShared: true
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
        paymentMethod: 'Vodafone Cash',
        workerAccepted: false,
        employerAccepted: true,
        contactShared: false
      }
    ];

    let createdHires = [];
    for (const hireData of sampleHires) {
      const hire = await prisma.hire.create({ data: hireData });
      createdHires.push(hire);
    }

    res.json({
      message: 'Test hires created successfully!',
      hires: createdHires
    });
  } catch (error) {
    console.error('Create test hire error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = {
  sendOffer,
  getMyHires,
  getAllHires,
  confirmPayment,
  submitPayment,
  createTestHire,
  acceptOffer,
  declineOffer
};