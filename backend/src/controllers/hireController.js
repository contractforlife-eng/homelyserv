import prisma from '../utils/prisma.js';

// SEND JOB OFFER (creates an Offer record instead of Hire)
export const sendOffer = async (req, res) => {
  try {
    const { workerId, agreedSalary, startDate, jobTitle, message } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    const salary = parseFloat(agreedSalary);
    const commission = salary * 0.10;
    const vat = commission * 0.14;
    const total = commission + vat;

    const reference = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const offer = await prisma.offer.create({
      data: {
        workerId,
        employerId: req.userId,
        jobTitle,
        message: message || null,
        salary,
        status: 'pending'
      }
    });

    res.status(201).json({ message: 'Offer sent successfully', offer });
  } catch (error) {
    console.error('Hire error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// RESPOND TO OFFER (accept/reject)
// On accept: creates corresponding Hire record
export const respondToOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "accepted" or "rejected"' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        employer: true,
        worker: true
      }
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Offer has already been responded to' });
    }

    // Update offer status
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status }
    });

    // If accepted, create Hire record
    if (status === 'accepted') {
      const salary = offer.salary;
      const commission = salary * 0.10;
      const vat = commission * 0.14;
      const total = commission + vat;

      const reference = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const hire = await prisma.hire.create({
        data: {
          workerId: offer.workerId,
          employerId: offer.employerId,
          agreedSalary: salary,
          commissionAmount: commission,
          vatAmount: vat,
          totalDue: total,
          paymentReference: reference,
          startDate: null,
          status: 'offer_sent'
        }
      });

      return res.json({ message: 'Offer accepted, Hire created', offer: updatedOffer, hire });
    }

    res.json({ message: 'Offer rejected', offer: updatedOffer });
  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY HIRES (backward compatible - returns array)
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

// GET MY OFFERS (new endpoint)
export const getMyOffers = async (req, res) => {
  try {
    let offers;

    if (req.userRole === 'EMPLOYER') {
      offers = await prisma.offer.findMany({
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
      offers = await prisma.offer.findMany({
        where: { workerId: profile.id },
        include: {
          employer: { select: { fullName: true, phone: true, city: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE HIRE STATUS
export const updateHireStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const hire = await prisma.hire.update({
      where: { id: req.params.hireId },
      data: { status }
    });
    res.json({ message: 'Hire status updated successfully', hire });
  } catch (error) {
    console.error('Update hire status error:', error);
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