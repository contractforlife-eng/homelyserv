// backend/src/routes/employerFamily.js
// ============================================================
// EMPLOYER "MY FAMILY" REST API — Milestone 1
// Strict multi-tenant isolation: every query is scoped to
// req.userId derived exclusively from the verified JWT.
// ============================================================
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireEmployer } from '../middleware/auth.js';

const router = express.Router();

const TREE_RELATIONSHIP_TYPES = ['parentOf', 'childOf', 'spouseOf', 'siblingOf', 'guardianOf'];

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// ============================================================
// GET /api/employer/family-members
// List all active (non-archived) family members for current employer
// ============================================================
router.get('/', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const includeArchived = req.query.includeArchived === 'true';

    const where = { employerId };
    if (!includeArchived) {
      where.isArchived = false;
    }

    const members = await prisma.employerFamilyMember.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving family members' });
  }
});

// ============================================================
// POST /api/employer/family-members
// Create a new lightweight family member profile
// ============================================================
router.post('/', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { firstName, relationship, birthYear, careNotes, neededServices } = req.body;

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'First name is required' });
    }

    if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Relationship is required' });
    }

    let parsedBirthYear = null;
    if (birthYear !== undefined && birthYear !== null && birthYear !== '') {
      const year = Number(birthYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
        return res.status(400).json({ success: false, message: `Birth year must be between 1900 and ${currentYear}` });
      }
      parsedBirthYear = year;
    }

    const cleanNeededServices = Array.isArray(neededServices)
      ? neededServices.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim())
      : [];

    const member = await prisma.employerFamilyMember.create({
      data: {
        employerId,
        firstName: firstName.trim(),
        relationship: relationship.trim(),
        birthYear: parsedBirthYear,
        careNotes: careNotes && typeof careNotes === 'string' ? careNotes.trim().slice(0, 1000) : null,
        neededServices: cleanNeededServices,
        isArchived: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      member
    });
  } catch (error) {
    console.error('Create family member error:', error);
    res.status(500).json({ success: false, message: 'Server error creating family member' });
  }
});

// ============================================================
// GET /api/employer/family-members/:id
// Get single family member (ownership enforced)
// ============================================================
router.get('/:id', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const member = await prisma.employerFamilyMember.findFirst({
      where: {
        id,
        employerId
      }
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Family member not found' });
    }

    res.json({
      success: true,
      member
    });
  } catch (error) {
    console.error('Get family member detail error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving family member' });
  }
});

// ============================================================
// PUT /api/employer/family-members/:id
// Update family member profile (ownership enforced)
// ============================================================
router.put('/:id', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;
    const { firstName, relationship, birthYear, careNotes, neededServices, isArchived } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const existing = await prisma.employerFamilyMember.findFirst({
      where: { id, employerId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Family member not found' });
    }

    const updateData = {};

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'First name cannot be empty' });
      }
      updateData.firstName = firstName.trim();
    }

    if (relationship !== undefined) {
      if (typeof relationship !== 'string' || relationship.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Relationship cannot be empty' });
      }
      updateData.relationship = relationship.trim();
    }

    if (birthYear !== undefined) {
      if (birthYear === null || birthYear === '') {
        updateData.birthYear = null;
      } else {
        const year = Number(birthYear);
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
          return res.status(400).json({ success: false, message: `Birth year must be between 1900 and ${currentYear}` });
        }
        updateData.birthYear = year;
      }
    }

    if (careNotes !== undefined) {
      updateData.careNotes = careNotes && typeof careNotes === 'string' ? careNotes.trim().slice(0, 1000) : null;
    }

    if (neededServices !== undefined) {
      updateData.neededServices = Array.isArray(neededServices)
        ? neededServices.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim())
        : [];
    }

    if (isArchived !== undefined) {
      updateData.isArchived = Boolean(isArchived);
    }

    const updated = await prisma.employerFamilyMember.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Family member updated successfully',
      member: updated
    });
  } catch (error) {
    console.error('Update family member error:', error);
    res.status(500).json({ success: false, message: 'Server error updating family member' });
  }
});

// ============================================================
// DELETE /api/employer/family-members/:id
// Archive/Soft-delete family member (ownership enforced)
// ============================================================
router.delete('/:id', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID' });
    }

    const existing = await prisma.employerFamilyMember.findFirst({
      where: { id, employerId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Family member not found' });
    }

    // Soft delete / archive
    await prisma.employerFamilyMember.update({
      where: { id },
      data: { isArchived: true }
    });

    // Also clean up any tree relationships referencing this member
    await prisma.employerFamilyRelationship.deleteMany({
      where: {
        employerId,
        OR: [
          { fromMemberId: id },
          { toMemberId: id }
        ]
      }
    });

    res.json({
      success: true,
      message: 'Family member archived successfully'
    });
  } catch (error) {
    console.error('Delete family member error:', error);
    res.status(500).json({ success: false, message: 'Server error archiving family member' });
  }
});

// ============================================================
// FAMILY TREE RELATIONSHIPS API (Foundation)
// ============================================================

// GET /api/employer/family-members/relationships/all
router.get('/relationships/all', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const relationships = await prisma.employerFamilyRelationship.findMany({
      where: { employerId }
    });
    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Get family relationships error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving relationships' });
  }
});

// POST /api/employer/family-members/relationships
router.post('/relationships', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { fromMemberId, toMemberId, relationshipType } = req.body;

    if (!isValidObjectId(fromMemberId) || !isValidObjectId(toMemberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member IDs' });
    }

    if (fromMemberId === toMemberId) {
      return res.status(400).json({ success: false, message: 'Cannot create relationship to self' });
    }

    if (!relationshipType || !TREE_RELATIONSHIP_TYPES.includes(relationshipType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid relationship type. Allowed: ${TREE_RELATIONSHIP_TYPES.join(', ')}`
      });
    }

    // Verify BOTH members belong to this employer and are not archived
    const members = await prisma.employerFamilyMember.findMany({
      where: {
        id: { in: [fromMemberId, toMemberId] },
        employerId,
        isArchived: false
      }
    });

    if (members.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Both family members must belong to your active family profiles'
      });
    }

    const rel = await prisma.employerFamilyRelationship.upsert({
      where: {
        fromMemberId_toMemberId_relationshipType: {
          fromMemberId,
          toMemberId,
          relationshipType
        }
      },
      update: {},
      create: {
        employerId,
        fromMemberId,
        toMemberId,
        relationshipType
      }
    });

    res.status(201).json({
      success: true,
      message: 'Family relationship saved',
      relationship: rel
    });
  } catch (error) {
    console.error('Create family relationship error:', error);
    res.status(500).json({ success: false, message: 'Server error saving relationship' });
  }
});

// DELETE /api/employer/family-members/relationships/:id
router.delete('/relationships/:id', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid relationship ID' });
    }

    const rel = await prisma.employerFamilyRelationship.findFirst({
      where: { id, employerId }
    });

    if (!rel) {
      return res.status(404).json({ success: false, message: 'Relationship not found' });
    }

    await prisma.employerFamilyRelationship.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Relationship removed successfully'
    });
  } catch (error) {
    console.error('Delete family relationship error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting relationship' });
  }
});

export default router;
