// backend/src/routes/employerFamilyTree.js
// ============================================================
// EMPLOYER "FAMILY TREE" REST API — Independent Genealogy
// Strict multi-tenant isolation: every query is scoped to
// req.userId derived exclusively from the verified JWT.
// Gated for Premium Employers (free users get 403 on mutations).
// ============================================================
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireEmployer } from '../middleware/auth.js';
import { hasActiveSubscription } from '../services/paymentAuthService.js';

const router = express.Router();

const TREE_RELATIONSHIP_TYPES = ['parentOf', 'childOf', 'spouseOf', 'siblingOf', 'guardianOf'];

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// Middleware to verify Premium for Family Tree write operations
const requirePremiumEmployer = async (req, res, next) => {
  try {
    const isPremium = await hasActiveSubscription(req.userId);
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        requiresPremium: true,
        message: 'Family Tree is a Premium feature. Upgrade to Premium to manage family relationships.'
      });
    }
    next();
  } catch (err) {
    console.error('requirePremiumEmployer error:', err);
    res.status(500).json({ success: false, message: 'Server error verifying subscription' });
  }
};

// ============================================================
// AUTO-MIGRATION / COMPATIBILITY ADAPTOR
// Migrates legacy relationships that had fromMemberId/toMemberId
// into EmployerFamilyTreePerson records on the fly.
// ============================================================
const syncLegacyTreeDataForEmployer = async (employerId) => {
  try {
    // 1. Check if there are legacy relationships missing fromPersonId/toPersonId
    const legacyRels = await prisma.employerFamilyRelationship.findMany({
      where: {
        employerId,
        OR: [
          { fromPersonId: null },
          { toPersonId: null }
        ]
      }
    });

    if (legacyRels.length === 0) return;

    // Collect all referenced member IDs
    const memberIds = new Set();
    legacyRels.forEach(r => {
      if (r.fromMemberId) memberIds.add(r.fromMemberId);
      if (r.toMemberId) memberIds.add(r.toMemberId);
    });

    if (memberIds.size === 0) return;

    // Fetch the family members
    const members = await prisma.employerFamilyMember.findMany({
      where: {
        id: { in: Array.from(memberIds) },
        employerId
      }
    });

    // Ensure each has a tree person
    const memberToPersonMap = new Map();
    for (const member of members) {
      let treePerson = await prisma.employerFamilyTreePerson.findFirst({
        where: { employerId, familyMemberId: member.id }
      });

      if (!treePerson) {
        treePerson = await prisma.employerFamilyTreePerson.create({
          data: {
            employerId,
            firstName: member.firstName,
            role: member.relationship || 'other',
            birthYear: member.birthYear,
            isDeceased: member.isDeceased || false,
            careNotes: member.careNotes,
            familyMemberId: member.id
          }
        });
      }
      memberToPersonMap.set(member.id, treePerson.id);
    }

    // Update the legacy relationships with fromPersonId and toPersonId
    for (const rel of legacyRels) {
      const fromPersonId = rel.fromPersonId || (rel.fromMemberId ? memberToPersonMap.get(rel.fromMemberId) : null);
      const toPersonId = rel.toPersonId || (rel.toMemberId ? memberToPersonMap.get(rel.toMemberId) : null);

      if (fromPersonId && toPersonId) {
        await prisma.employerFamilyRelationship.update({
          where: { id: rel.id },
          data: { fromPersonId, toPersonId }
        });
      }
    }
  } catch (err) {
    console.warn('Auto-migration sync warning for employer:', employerId, err.message);
  }
};

// ============================================================
// GET /api/employer/family-tree/people
// List all Family Tree persons for current employer (Free + Premium)
// ============================================================
router.get('/people', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    await syncLegacyTreeDataForEmployer(employerId);

    const people = await prisma.employerFamilyTreePerson.findMany({
      where: { employerId },
      include: {
        familyMember: {
          select: {
            id: true,
            firstName: true,
            relationship: true,
            neededServices: true,
            isArchived: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      people
    });
  } catch (error) {
    console.error('Get tree people error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tree people' });
  }
});

// ============================================================
// POST /api/employer/family-tree/people
// Add a person to the Family Tree (Premium required)
// Can be standalone (newborn/relative) OR linked to an existing Family Member.
// ============================================================
router.post('/people', requireEmployer, requirePremiumEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { firstName, role, birthYear, isDeceased, careNotes, familyMemberId } = req.body;

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'First name is required' });
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

    let validatedFamilyMemberId = null;
    if (familyMemberId) {
      if (!isValidObjectId(familyMemberId)) {
        return res.status(400).json({ success: false, message: 'Invalid family member ID' });
      }

      // Verify ownership of the family member
      const member = await prisma.employerFamilyMember.findFirst({
        where: { id: familyMemberId, employerId, isArchived: false }
      });

      if (!member) {
        return res.status(404).json({ success: false, message: 'Family member not found' });
      }

      // Check if this family member is already in the tree
      const existingTreePerson = await prisma.employerFamilyTreePerson.findFirst({
        where: { employerId, familyMemberId }
      });

      if (existingTreePerson) {
        return res.status(400).json({
          success: false,
          message: 'This family member is already added to your Family Tree'
        });
      }

      validatedFamilyMemberId = familyMemberId;
    }

    const treePerson = await prisma.employerFamilyTreePerson.create({
      data: {
        employerId,
        firstName: firstName.trim(),
        role: role && typeof role === 'string' ? role.trim() : 'other',
        birthYear: parsedBirthYear,
        isDeceased: Boolean(isDeceased),
        careNotes: careNotes && typeof careNotes === 'string' ? careNotes.trim().slice(0, 1000) : null,
        familyMemberId: validatedFamilyMemberId
      },
      include: {
        familyMember: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Person added to Family Tree',
      person: treePerson
    });
  } catch (error) {
    console.error('Create tree person error:', error);
    res.status(500).json({ success: false, message: 'Server error creating tree person' });
  }
});

// ============================================================
// PUT /api/employer/family-tree/people/:id
// Update a Tree person's details (Premium required)
// ============================================================
router.put('/people/:id', requireEmployer, requirePremiumEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;
    const { firstName, role, birthYear, isDeceased, careNotes, familyMemberId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid person ID' });
    }

    const existing = await prisma.employerFamilyTreePerson.findFirst({
      where: { id, employerId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tree person not found' });
    }

    const updateData = {};

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'First name cannot be empty' });
      }
      updateData.firstName = firstName.trim();
    }

    if (role !== undefined) {
      updateData.role = typeof role === 'string' ? role.trim() : 'other';
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

    if (isDeceased !== undefined) {
      updateData.isDeceased = Boolean(isDeceased);
    }

    if (careNotes !== undefined) {
      updateData.careNotes = careNotes && typeof careNotes === 'string' ? careNotes.trim().slice(0, 1000) : null;
    }

    if (familyMemberId !== undefined) {
      if (familyMemberId === null || familyMemberId === '') {
        updateData.familyMemberId = null;
      } else {
        if (!isValidObjectId(familyMemberId)) {
          return res.status(400).json({ success: false, message: 'Invalid family member ID' });
        }
        const member = await prisma.employerFamilyMember.findFirst({
          where: { id: familyMemberId, employerId, isArchived: false }
        });
        if (!member) {
          return res.status(404).json({ success: false, message: 'Family member not found' });
        }
        updateData.familyMemberId = familyMemberId;
      }
    }

    const updated = await prisma.employerFamilyTreePerson.update({
      where: { id },
      data: updateData,
      include: {
        familyMember: true
      }
    });

    res.json({
      success: true,
      message: 'Tree person updated successfully',
      person: updated
    });
  } catch (error) {
    console.error('Update tree person error:', error);
    res.status(500).json({ success: false, message: 'Server error updating tree person' });
  }
});

// ============================================================
// DELETE /api/employer/family-tree/people/:id
// Remove person from Family Tree (Premium required)
// Deletes Tree Person + their Tree relationships.
// DOES NOT delete or archive the canonical EmployerFamilyMember!
// ============================================================
router.delete('/people/:id', requireEmployer, requirePremiumEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid person ID' });
    }

    const existing = await prisma.employerFamilyTreePerson.findFirst({
      where: { id, employerId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tree person not found' });
    }

    // 1. Delete all tree relationships referencing this person
    await prisma.employerFamilyRelationship.deleteMany({
      where: {
        employerId,
        OR: [
          { fromPersonId: id },
          { toPersonId: id },
          // Also clean legacy matches if any
          ...(existing.familyMemberId ? [{ fromMemberId: existing.familyMemberId }, { toMemberId: existing.familyMemberId }] : [])
        ]
      }
    });

    // 2. Delete the TreePerson record (leaving EmployerFamilyMember untouched)
    await prisma.employerFamilyTreePerson.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Person removed from Family Tree'
    });
  } catch (error) {
    console.error('Delete tree person error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting tree person' });
  }
});

// ============================================================
// GET /api/employer/family-tree/relationships
// Get all family tree relationships for current employer
// ============================================================
router.get('/relationships', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    await syncLegacyTreeDataForEmployer(employerId);

    const relationships = await prisma.employerFamilyRelationship.findMany({
      where: { employerId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Get tree relationships error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tree relationships' });
  }
});

// ============================================================
// POST /api/employer/family-tree/relationships
// Create a relationship between two Tree Persons (Premium required)
// ============================================================
router.post('/relationships', requireEmployer, requirePremiumEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const { fromPersonId, toPersonId, relationshipType } = req.body;

    if (!isValidObjectId(fromPersonId) || !isValidObjectId(toPersonId)) {
      return res.status(400).json({ success: false, message: 'Invalid person IDs' });
    }

    if (fromPersonId === toPersonId) {
      return res.status(400).json({ success: false, message: 'Cannot create relationship to self' });
    }

    if (!relationshipType || !TREE_RELATIONSHIP_TYPES.includes(relationshipType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid relationship type. Allowed: ${TREE_RELATIONSHIP_TYPES.join(', ')}`
      });
    }

    // Verify BOTH tree persons belong to this employer
    const people = await prisma.employerFamilyTreePerson.findMany({
      where: {
        id: { in: [fromPersonId, toPersonId] },
        employerId
      }
    });

    if (people.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Both persons must exist in your Family Tree'
      });
    }

    // Check existing identical relationship
    const existing = await prisma.employerFamilyRelationship.findFirst({
      where: {
        employerId,
        fromPersonId,
        toPersonId,
        relationshipType
      }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Relationship already exists',
        relationship: existing
      });
    }

    const rel = await prisma.employerFamilyRelationship.create({
      data: {
        employerId,
        fromPersonId,
        toPersonId,
        relationshipType
      }
    });

    res.status(201).json({
      success: true,
      message: 'Relationship created successfully',
      relationship: rel
    });
  } catch (error) {
    console.error('Create tree relationship error:', error);
    res.status(500).json({ success: false, message: 'Server error creating relationship' });
  }
});

// ============================================================
// DELETE /api/employer/family-tree/relationships/:id
// Delete a specific relationship by ID (Premium required)
// ============================================================
router.delete('/relationships/:id', requireEmployer, requirePremiumEmployer, async (req, res) => {
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
    console.error('Delete tree relationship error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting relationship' });
  }
});

export default router;
