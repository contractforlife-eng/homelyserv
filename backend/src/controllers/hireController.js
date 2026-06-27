import prisma from '../utils/prisma.js';

// SEND JOB OFFER
export const sendOffer = async (req, res) => {
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

// GET MY HIRES
export const getMyHires = async (req, res) => {
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
export const getAllHires = async (req, res) => {
  try {
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

// CONFIRM PAYMENT
export const confirmPayment = async (req, res) => {
  try {
    const hire = await prisma.hire.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'confirmed', status: 'active' }
    });
    res.json({ message: 'Payment confirmed', hire });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SUBMIT PAYMENT PROOF
export const submitPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const paymentProofUrl = req.file ? req.file.path : null;

    if (!paymentProofUrl) {
      return res.status(400).json({ message: 'Payment receipt is required' });
    }

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