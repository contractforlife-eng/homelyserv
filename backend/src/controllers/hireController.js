import prisma from '../lib/prisma.js';

const createNotification = async (userId, type, title, body) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, isRead: false }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// SEND JOB OFFER (creates an Offer record instead of Hire)
export const sendOffer = async (req, res) => {
  try {
    const {
      workerId,
      agreedSalary,
      startDate,
      jobTitle,
      message,
      workerName,
      workerEmail,
      workerPhone,
      workerLocation,
      workerRating,
      workerSkills,
      workerImage,
      employerName,
      employerEmail,
      hourlyRate,
      amount,
      description
    } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    const salary = parseFloat(agreedSalary);
    const commission = salary * 0.10;
    const vat = commission * 0.14;
    const total = commission + vat;

    const reference = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let effectiveWorkerId = workerId;
    try {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: workerId }
      });
      if (workerProfile) {
        effectiveWorkerId = workerProfile.id;
      }
    } catch (_) {
      console.warn('⚠️ WorkerProfile lookup failed, using workerId as-is:', workerId);
    }

    const offer = await prisma.offer.create({
      data: {
        workerId: effectiveWorkerId,
        employerId: req.userId,
        jobTitle,
        message: message || null,
        salary,
        status: 'pending',
        workerName: workerName || null,
        workerEmail: workerEmail || null,
        workerPhone: workerPhone || null,
        workerLocation: workerLocation || null,
        workerRating: workerRating ? parseFloat(workerRating) : null,
        workerSkills: workerSkills || [],
        workerImage: workerImage || null,
        employerName: employerName || null,
        employerEmail: employerEmail || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        amount: amount ? parseFloat(amount) : null,
        description: description || null,
        contactRevealed: false,
        paymentConfirmed: false,
        paymentVerified: false
      }
    });

    const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: effectiveWorkerId } });
    if (workerProfile) {
      await createNotification(
        workerProfile.userId,
        'offer',
        'New Job Offer',
        `${employerName || 'An employer'} sent you a job offer for ${jobTitle}`
      );
    }

    res.status(201).json({ success: true, message: 'Offer sent successfully', offer });
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

    const worker = await prisma.workerProfile.findUnique({ where: { id: offer.workerId } });

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

      if (worker) {
        await createNotification(
          worker.userId,
          'offer',
          'Offer Accepted',
          `You accepted the offer from ${offer.employerName || 'Employer'} for ${offer.jobTitle}`
        );
      }

      return res.json({ message: 'Offer accepted, Hire created', offer: updatedOffer, hire });
    }

    if (worker) {
      await createNotification(
        worker.userId,
        'offer',
        'Offer Rejected',
        `You rejected the offer from ${offer.employerName || 'Employer'} for ${offer.jobTitle}`
      );
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

// UPDATE OFFER STATUS
export const updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected', 'paid', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status }
    });

    const worker = await prisma.workerProfile.findUnique({ where: { id: offer.workerId } });
    if (worker && ['accepted', 'rejected', 'paid', 'in_progress', 'completed'].includes(status)) {
      await createNotification(
        worker.userId,
        'offer',
        'Offer Status Updated',
        `Your offer for ${offer.jobTitle} has been updated to ${status}`
      );
    }

    res.json({ message: 'Offer status updated', offer: updatedOffer });
  } catch (error) {
    console.error('Update offer status error:', error);
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