// src/pages/EmployerFamily.jsx — Employer "My Family" & Interactive Family Tree
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import RolePageHeader from '../components/common/RolePageHeader';
import familyService from '../services/familyService';
import familyTreeService from '../services/familyTreeService';
import { isUserPremium } from '../utils/subscriptionService';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Heart,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  Layers,
  ChevronRight,
  Briefcase,
  X,
  Plus,
  MoreVertical,
  Baby,
  UserCheck,
  UserX,
  Sparkles,
  HelpCircle,
  Check,
  Crown,
  ShieldCheck
} from 'lucide-react';

const RELATIONSHIP_OPTIONS = [
  { value: 'child', labelKey: 'employerFamily.relationships.child' },
  { value: 'parent', labelKey: 'employerFamily.relationships.parent' },
  { value: 'spouse', labelKey: 'employerFamily.relationships.spouse' },
  { value: 'grandparent', labelKey: 'employerFamily.relationships.grandparent' },
  { value: 'sibling', labelKey: 'employerFamily.relationships.sibling' },
  { value: 'self', labelKey: 'employerFamily.relationships.self' },
  { value: 'other', labelKey: 'employerFamily.relationships.other' }
];

const SERVICE_OPTIONS = [
  'Babysitter',
  'Elderly Care',
  'Nurse',
  'Private Tutor',
  'Driver',
  'Cook',
  'House Manager',
  'Security Guard',
  'Gardener'
];

const TREE_REL_OPTIONS = [
  { value: 'parentOf', labelKey: 'employerFamily.tree.parentOf' },
  { value: 'childOf', labelKey: 'employerFamily.tree.childOf' },
  { value: 'spouseOf', labelKey: 'employerFamily.tree.spouseOf' },
  { value: 'siblingOf', labelKey: 'employerFamily.tree.siblingOf' },
  { value: 'guardianOf', labelKey: 'employerFamily.tree.guardianOf' }
];

const EmployerFamily = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [activeTab, setActiveTab] = useState('tree'); // default to 'tree' for visual tree immersion
  const [members, setMembers] = useState([]);
  const [treePeople, setTreePeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const isPremium = Boolean(isUserPremium(authUser?.id || authUser?.email));

  // Add / Edit Family Member modal state (Free contacts/members)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    relationship: 'child',
    birthYear: '',
    careNotes: '',
    neededServices: [],
    isDeceased: false
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Add Standalone Person to Tree Modal State (Premium)
  const [isTreePersonModalOpen, setIsTreePersonModalOpen] = useState(false);
  const [editingTreePerson, setEditingTreePerson] = useState(null);
  const [treePersonFormData, setTreePersonFormData] = useState({
    firstName: '',
    role: 'child',
    birthYear: '',
    careNotes: '',
    isDeceased: false,
    familyMemberId: null
  });
  const [treePersonSubmitting, setTreePersonSubmitting] = useState(false);
  const [treePersonError, setTreePersonError] = useState('');

  // Add Existing Family Member to Tree Modal State (Premium)
  const [isLinkMemberModalOpen, setIsLinkMemberModalOpen] = useState(false);
  const [selectedMemberIdToLink, setSelectedMemberIdToLink] = useState('');
  const [linkMemberSubmitting, setLinkMemberSubmitting] = useState(false);
  const [linkMemberError, setLinkMemberError] = useState('');

  // Quick Add Relative Modal State (Quick context add from tree person card)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddAnchorPerson, setQuickAddAnchorPerson] = useState(null);
  const [quickAddRelType, setQuickAddRelType] = useState('child'); // 'child' | 'spouse' | 'parent' | 'sibling'
  const [quickAddFormData, setQuickAddFormData] = useState({
    firstName: '',
    birthYear: '',
    careNotes: '',
    isDeceased: false
  });
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');

  // Relationship Connect Modal State (Tree persons)
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [relFormData, setRelFormData] = useState({
    fromPersonId: '',
    toPersonId: '',
    relationshipType: 'parentOf'
  });
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relError, setRelError] = useState('');

  // Active card menu popover state
  const [activeMenuPersonId, setActiveMenuPersonId] = useState(null);

  // Auth gate
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser || authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }
  }, [authLoading, isAuthenticated, authUser, navigate]);

  // Load family members, tree people & tree relationships
  const loadFamilyData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [membersRes, treePeopleRes, relRes] = await Promise.allSettled([
        familyService.getFamilyMembers(false),
        familyTreeService.getTreePeople(),
        familyTreeService.getTreeRelationships()
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.success) {
        setMembers(membersRes.value.members || []);
      } else {
        setError(t('employerFamily.loadError'));
      }

      if (treePeopleRes.status === 'fulfilled' && treePeopleRes.value?.success) {
        setTreePeople(treePeopleRes.value.people || []);
      }

      if (relRes.status === 'fulfilled' && relRes.value?.success) {
        setRelationships(relRes.value.relationships || []);
      }
    } catch (err) {
      console.error('Failed to load family/tree data:', err);
      setError(t('employerFamily.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated && authUser?.role === 'EMPLOYER') {
      loadFamilyData();
    }
  }, [isAuthenticated, authUser, loadFamilyData]);

  // Close open action menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuPersonId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- FAMILY MEMBERS CRUD (FREE) ---
  const openAddMemberModal = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      relationship: 'child',
      birthYear: '',
      careNotes: '',
      neededServices: [],
      isDeceased: false
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditMemberModal = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      relationship: member.relationship || 'other',
      birthYear: member.birthYear ? String(member.birthYear) : '',
      careNotes: member.careNotes || '',
      neededServices: member.neededServices || [],
      isDeceased: Boolean(member.isDeceased)
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleService = (service) => {
    setFormData(prev => {
      const exists = prev.neededServices.includes(service);
      return {
        ...prev,
        neededServices: exists
          ? prev.neededServices.filter(s => s !== service)
          : [...prev.neededServices, service]
      };
    });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.firstName.trim()) {
      setModalError(t('employerFamily.validation.nameRequired'));
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        relationship: formData.relationship,
        birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
        careNotes: formData.careNotes.trim() || null,
        neededServices: formData.neededServices,
        isDeceased: formData.isDeceased
      };

      if (editingMember) {
        const res = await familyService.updateFamilyMember(editingMember.id, payload);
        if (res?.success) {
          setMembers(prev => prev.map(m => m.id === editingMember.id ? res.member : m));
          setSuccessMsg(t('employerFamily.memberUpdated'));
          setIsModalOpen(false);
        }
      } else {
        const res = await familyService.createFamilyMember(payload);
        if (res?.success) {
          setMembers(prev => [...prev, res.member]);
          setSuccessMsg(t('employerFamily.memberAdded'));
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Save member error:', err);
      setModalError(err.response?.data?.message || t('employerFamily.saveError'));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleArchiveMember = async (id, name) => {
    if (!window.confirm(t('employerFamily.confirmArchive', { name }))) {
      return;
    }
    try {
      const res = await familyService.archiveFamilyMember(id);
      if (res?.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
        // Also update treePeople local state if linked member was unlinked on server
        setTreePeople(prev => prev.map(p => p.familyMemberId === id ? { ...p, familyMemberId: null, familyMember: null } : p));
        setSuccessMsg(t('employerFamily.memberArchived'));
      }
    } catch (err) {
      console.error('Archive member error:', err);
      alert(t('employerFamily.archiveError'));
    }
  };

  const handleToggleMemberDeceased = async (member) => {
    const nextStatus = !member.isDeceased;
    const confirmMsg = nextStatus
      ? t('employerFamily.deceasedConfirm', { name: member.firstName })
      : t('employerFamily.livingConfirm', { name: member.firstName });

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await familyService.updateFamilyMember(member.id, { isDeceased: nextStatus });
      if (res?.success) {
        setMembers(prev => prev.map(m => m.id === member.id ? res.member : m));
        setSuccessMsg(t('employerFamily.memberUpdated'));
      }
    } catch (err) {
      console.error('Toggle deceased error:', err);
      alert(t('employerFamily.saveError'));
    }
  };

  // --- TREE PERSON CRUD & ACTIONS (PREMIUM) ---
  const openAddTreePersonModal = () => {
    setEditingTreePerson(null);
    setTreePersonFormData({
      firstName: '',
      role: 'child',
      birthYear: '',
      careNotes: '',
      isDeceased: false,
      familyMemberId: null
    });
    setTreePersonError('');
    setIsTreePersonModalOpen(true);
  };

  const openEditTreePersonModal = (person) => {
    setEditingTreePerson(person);
    setTreePersonFormData({
      firstName: person.firstName || '',
      role: person.role || 'other',
      birthYear: person.birthYear ? String(person.birthYear) : '',
      careNotes: person.careNotes || '',
      isDeceased: Boolean(person.isDeceased),
      familyMemberId: person.familyMemberId || null
    });
    setTreePersonError('');
    setIsTreePersonModalOpen(true);
  };

  const handleSaveTreePerson = async (e) => {
    e.preventDefault();
    setTreePersonError('');

    if (!treePersonFormData.firstName.trim()) {
      setTreePersonError(t('employerFamily.validation.nameRequired'));
      return;
    }

    setTreePersonSubmitting(true);
    try {
      const payload = {
        firstName: treePersonFormData.firstName.trim(),
        role: treePersonFormData.role,
        birthYear: treePersonFormData.birthYear ? parseInt(treePersonFormData.birthYear, 10) : null,
        careNotes: treePersonFormData.careNotes.trim() || null,
        isDeceased: treePersonFormData.isDeceased,
        familyMemberId: treePersonFormData.familyMemberId || null
      };

      if (editingTreePerson) {
        const res = await familyTreeService.updateTreePerson(editingTreePerson.id, payload);
        if (res?.success) {
          setTreePeople(prev => prev.map(p => p.id === editingTreePerson.id ? res.person : p));
          setSuccessMsg(t('employerFamily.memberUpdated'));
          setIsTreePersonModalOpen(false);
        }
      } else {
        const res = await familyTreeService.createTreePerson(payload);
        if (res?.success) {
          setTreePeople(prev => [...prev, res.person]);
          setSuccessMsg(t('employerFamily.tree.relationAdded'));
          setIsTreePersonModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Save tree person error:', err);
      setTreePersonError(err.response?.data?.message || t('employerFamily.tree.saveError'));
    } finally {
      setTreePersonSubmitting(false);
    }
  };

  const handleRemoveTreePerson = async (person) => {
    if (!window.confirm(t('employerFamily.tree.removeConfirmDesc', { name: person.firstName }))) {
      return;
    }
    try {
      const res = await familyTreeService.deleteTreePerson(person.id);
      if (res?.success) {
        setTreePeople(prev => prev.filter(p => p.id !== person.id));
        setRelationships(prev => prev.filter(r => (r.fromPersonId || r.fromMemberId) !== person.id && (r.toPersonId || r.toMemberId) !== person.id));
        setSuccessMsg(t('employerFamily.tree.memberRemovedFromTree', { name: person.firstName }));
      }
    } catch (err) {
      console.error('Remove tree person error:', err);
      alert(err.response?.data?.message || t('employerFamily.tree.saveError'));
    }
  };

  const handleToggleTreePersonDeceased = async (person) => {
    const nextStatus = !person.isDeceased;
    const confirmMsg = nextStatus
      ? t('employerFamily.deceasedConfirm', { name: person.firstName })
      : t('employerFamily.livingConfirm', { name: person.firstName });

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await familyTreeService.updateTreePerson(person.id, { isDeceased: nextStatus });
      if (res?.success) {
        setTreePeople(prev => prev.map(p => p.id === person.id ? res.person : p));
        setSuccessMsg(t('employerFamily.memberUpdated'));
      }
    } catch (err) {
      console.error('Toggle deceased error:', err);
      alert(t('employerFamily.tree.saveError'));
    }
  };

  // --- LINK EXISTING FAMILY MEMBER TO TREE ---
  const unlinkedMembers = useMemo(() => {
    const linkedMemberIds = new Set(treePeople.map(p => p.familyMemberId).filter(Boolean));
    return members.filter(m => !linkedMemberIds.has(m.id));
  }, [members, treePeople]);

  const openLinkMemberModal = () => {
    if (unlinkedMembers.length > 0) {
      setSelectedMemberIdToLink(unlinkedMembers[0].id);
    } else {
      setSelectedMemberIdToLink('');
    }
    setLinkMemberError('');
    setIsLinkMemberModalOpen(true);
  };

  const handleLinkExistingMemberToTree = async (e) => {
    e.preventDefault();
    setLinkMemberError('');

    if (!selectedMemberIdToLink) {
      setLinkMemberError(t('employerFamily.tree.selectMemberToLink'));
      return;
    }

    const member = members.find(m => m.id === selectedMemberIdToLink);
    if (!member) return;

    setLinkMemberSubmitting(true);
    try {
      const payload = {
        firstName: member.firstName,
        role: member.relationship || 'other',
        birthYear: member.birthYear,
        isDeceased: member.isDeceased || false,
        careNotes: member.careNotes,
        familyMemberId: member.id
      };

      const res = await familyTreeService.createTreePerson(payload);
      if (res?.success) {
        setTreePeople(prev => [...prev, res.person]);
        setSuccessMsg(t('employerFamily.tree.relationAdded'));
        setIsLinkMemberModalOpen(false);
      }
    } catch (err) {
      console.error('Link existing member error:', err);
      setLinkMemberError(err.response?.data?.message || t('employerFamily.tree.saveError'));
    } finally {
      setLinkMemberSubmitting(false);
    }
  };

  // --- QUICK ADD RELATIVE IN TREE ---
  const openQuickAddRelative = (anchorPerson, relType) => {
    setQuickAddAnchorPerson(anchorPerson);
    setQuickAddRelType(relType);
    setQuickAddFormData({
      firstName: '',
      birthYear: '',
      careNotes: '',
      isDeceased: false
    });
    setQuickAddError('');
    setIsQuickAddModalOpen(true);
    setActiveMenuPersonId(null);
  };

  const handleSaveQuickAddRelative = async (e) => {
    e.preventDefault();
    setQuickAddError('');

    if (!quickAddFormData.firstName.trim()) {
      setQuickAddError(t('employerFamily.validation.nameRequired'));
      return;
    }

    setQuickAddSubmitting(true);
    try {
      // 1. Create new standalone Tree Person (familyMemberId = null)
      const personPayload = {
        firstName: quickAddFormData.firstName.trim(),
        role: quickAddRelType,
        birthYear: quickAddFormData.birthYear ? parseInt(quickAddFormData.birthYear, 10) : null,
        careNotes: quickAddFormData.careNotes.trim() || null,
        isDeceased: quickAddFormData.isDeceased,
        familyMemberId: null
      };

      const personRes = await familyTreeService.createTreePerson(personPayload);
      if (!personRes?.success || !personRes.person) {
        throw new Error('Failed to create tree person');
      }

      const newPerson = personRes.person;
      setTreePeople(prev => [...prev, newPerson]);

      // 2. Automatically create reciprocal tree relationship with anchor person
      let relPayload = null;
      if (quickAddRelType === 'child') {
        relPayload = {
          fromPersonId: quickAddAnchorPerson.id,
          toPersonId: newPerson.id,
          relationshipType: 'parentOf'
        };
      } else if (quickAddRelType === 'spouse') {
        relPayload = {
          fromPersonId: quickAddAnchorPerson.id,
          toPersonId: newPerson.id,
          relationshipType: 'spouseOf'
        };
      } else if (quickAddRelType === 'parent') {
        relPayload = {
          fromPersonId: newPerson.id,
          toPersonId: quickAddAnchorPerson.id,
          relationshipType: 'parentOf'
        };
      } else if (quickAddRelType === 'sibling') {
        relPayload = {
          fromPersonId: quickAddAnchorPerson.id,
          toPersonId: newPerson.id,
          relationshipType: 'siblingOf'
        };
      }

      if (relPayload) {
        try {
          const relRes = await familyTreeService.createTreeRelationship(relPayload);
          if (relRes?.success) {
            setRelationships(prev => [...prev, relRes.relationship]);
          }
        } catch (rErr) {
          console.warn('Tree relationship auto-link warning:', rErr);
        }
      }

      setSuccessMsg(t('employerFamily.tree.relationAdded'));
      setIsQuickAddModalOpen(false);
    } catch (err) {
      console.error('Quick add tree relative error:', err);
      setQuickAddError(err.response?.data?.message || t('employerFamily.tree.saveError'));
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  // --- RELATIONSHIPS MODAL (PREMIUM) ---
  const handleSaveRelationship = async (e) => {
    e.preventDefault();
    setRelError('');

    if (!relFormData.fromPersonId || !relFormData.toPersonId) {
      setRelError(t('employerFamily.tree.selectBothMembers'));
      return;
    }
    if (relFormData.fromPersonId === relFormData.toPersonId) {
      setRelError(t('employerFamily.tree.cannotLinkSelf'));
      return;
    }

    setRelSubmitting(true);
    try {
      const res = await familyTreeService.createTreeRelationship(relFormData);
      if (res?.success) {
        setRelationships(prev => {
          const filtered = prev.filter(r => !(r.fromPersonId === relFormData.fromPersonId && r.toPersonId === relFormData.toPersonId && r.relationshipType === relFormData.relationshipType));
          return [...filtered, res.relationship];
        });
        setSuccessMsg(t('employerFamily.tree.relationAdded'));
        setIsRelModalOpen(false);
      }
    } catch (err) {
      console.error('Save relationship error:', err);
      setRelError(err.response?.data?.message || t('employerFamily.tree.saveError'));
    } finally {
      setRelSubmitting(false);
    }
  };

  const handleDeleteRelationship = async (id) => {
    try {
      const res = await familyTreeService.deleteTreeRelationship(id);
      if (res?.success) {
        setRelationships(prev => prev.filter(r => r.id !== id));
        setSuccessMsg(t('employerFamily.tree.relationDeleted'));
      }
    } catch (err) {
      console.error('Delete relationship error:', err);
    }
  };

  const getPersonName = (id) => {
    const person = treePeople.find(p => p.id === id || p.familyMemberId === id);
    if (person) return person.firstName;
    const member = members.find(m => m.id === id);
    return member ? member.firstName : t('employerFamily.unknownMember');
  };

  // =========================================================================
  // TREE DERIVATION ENGINE: Organize treePeople into hierarchical generations
  // =========================================================================
  const treeGenerations = useMemo(() => {
    if (treePeople.length === 0) return { grandparents: [], parents: [], children: [], grandchildren: [], extended: [] };

    const personMap = new Map(treePeople.map(p => [p.id, p]));
    const parentToChildren = new Map();
    const childToParents = new Map();
    const spousePairs = new Map();

    relationships.forEach(rel => {
      const fromId = rel.fromPersonId || rel.fromMemberId;
      const toId = rel.toPersonId || rel.toMemberId;
      const { relationshipType } = rel;

      if (!fromId || !toId) return;

      if (relationshipType === 'parentOf') {
        if (!parentToChildren.has(fromId)) parentToChildren.set(fromId, []);
        parentToChildren.get(fromId).push(toId);

        if (!childToParents.has(toId)) childToParents.set(toId, []);
        childToParents.get(toId).push(fromId);
      } else if (relationshipType === 'childOf') {
        if (!parentToChildren.has(toId)) parentToChildren.set(toId, []);
        parentToChildren.get(toId).push(fromId);

        if (!childToParents.has(fromId)) childToParents.set(fromId, []);
        childToParents.get(fromId).push(toId);
      } else if (relationshipType === 'spouseOf') {
        spousePairs.set(fromId, toId);
        spousePairs.set(toId, fromId);
      }
    });

    const assigned = new Set();
    const grandparents = [];
    const parents = [];
    const children = [];
    const grandchildren = [];
    const extended = [];

    // 1. Identify Grandparents (role 'grandparent' or parent of someone who has children)
    treePeople.forEach(p => {
      if (p.role === 'grandparent') {
        grandparents.push(p);
        assigned.add(p.id);
      } else {
        const directChildren = parentToChildren.get(p.id) || [];
        const hasGrandchildren = directChildren.some(cId => (parentToChildren.get(cId) || []).length > 0);
        if (hasGrandchildren && !childToParents.has(p.id)) {
          grandparents.push(p);
          assigned.add(p.id);
        }
      }
    });

    // 2. Identify Parents / Core Generation (self, spouse, parent role, or parent of children)
    treePeople.forEach(p => {
      if (assigned.has(p.id)) return;
      if (p.role === 'self' || p.role === 'spouse' || p.role === 'parent') {
        parents.push(p);
        assigned.add(p.id);
      } else if (parentToChildren.has(p.id) && !grandparents.some(gp => gp.id === p.id)) {
        parents.push(p);
        assigned.add(p.id);
      }
    });

    // 3. Identify Children
    treePeople.forEach(p => {
      if (assigned.has(p.id)) return;
      if (p.role === 'child') {
        children.push(p);
        assigned.add(p.id);
      } else {
        const parentsOfP = childToParents.get(p.id) || [];
        const isChildOfCore = parentsOfP.some(pId => parents.some(parent => parent.id === pId));
        if (isChildOfCore) {
          children.push(p);
          assigned.add(p.id);
        }
      }
    });

    // 4. Identify Grandchildren (children of 'children')
    treePeople.forEach(p => {
      if (assigned.has(p.id)) return;
      const parentsOfP = childToParents.get(p.id) || [];
      const isGrandchild = parentsOfP.some(pId => children.some(c => c.id === pId));
      if (isGrandchild) {
        grandchildren.push(p);
        assigned.add(p.id);
      }
    });

    // 5. Extended Household (siblings, guardians, unlinked)
    treePeople.forEach(p => {
      if (!assigned.has(p.id)) {
        if (p.role === 'sibling') {
          parents.push(p); // Siblings share the core generation
          assigned.add(p.id);
        } else {
          extended.push(p);
          assigned.add(p.id);
        }
      }
    });

    return { grandparents, parents, children, grandchildren, extended };
  }, [treePeople, relationships]);

  // Helper to render an individual Person Card inside the Tree
  const renderTreePersonCard = (person) => {
    const isMenuOpen = activeMenuPersonId === person.id;
    const isDeceased = Boolean(person.isDeceased);
    const linkedMember = person.familyMember;

    return (
      <div
        key={person.id}
        className={`relative group rounded-2xl p-4 transition-all duration-200 border w-56 sm:w-64 text-left ${
          isDeceased
            ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 shadow-sm opacity-90'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-teal-500 dark:hover:border-teal-400'
        }`}
      >
        {/* Deceased Ribbon / Badge */}
        {isDeceased && (
          <div className="absolute -top-2.5 right-3 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span>{t('employerFamily.deceased')}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${
                isDeceased
                  ? 'bg-slate-400 text-white dark:bg-slate-700 dark:text-slate-300'
                  : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white'
              }`}
            >
              {person.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className={`font-bold text-sm truncate ${isDeceased ? 'text-slate-700 dark:text-slate-300' : 'text-gray-900 dark:text-white'}`}>
                {person.firstName}
              </h4>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                isDeceased
                  ? 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  : 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
              }`}>
                {t(`employerFamily.relationships.${person.role}`, { defaultValue: person.role })}
              </span>
            </div>
          </div>

          {/* Card Action Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuPersonId(isMenuOpen ? null : person.id);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Actions"
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown Popover */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 py-1.5 text-xs text-gray-700 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => openQuickAddRelative(person, 'child')}
                  className="w-full text-left px-3 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 text-teal-700 dark:text-teal-300"
                >
                  <Plus size={14} />
                  <span>{t('employerFamily.tree.actions.addChild')}</span>
                </button>
                <button
                  onClick={() => openQuickAddRelative(person, 'spouse')}
                  className="w-full text-left px-3 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 text-teal-700 dark:text-teal-300"
                >
                  <Heart size={14} />
                  <span>{t('employerFamily.tree.actions.addSpouse')}</span>
                </button>
                <button
                  onClick={() => openQuickAddRelative(person, 'parent')}
                  className="w-full text-left px-3 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 text-teal-700 dark:text-teal-300"
                >
                  <Users size={14} />
                  <span>{t('employerFamily.tree.actions.addParent')}</span>
                </button>
                <button
                  onClick={() => openQuickAddRelative(person, 'sibling')}
                  className="w-full text-left px-3 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2 text-teal-700 dark:text-teal-300"
                >
                  <Layers size={14} />
                  <span>{t('employerFamily.tree.actions.addSibling')}</span>
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

                <button
                  onClick={() => {
                    setActiveMenuPersonId(null);
                    openEditTreePersonModal(person);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  <span>{t('employerFamily.tree.actions.editMember')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenuPersonId(null);
                    handleToggleTreePersonDeceased(person);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {isDeceased ? <UserCheck size={14} /> : <UserX size={14} />}
                  <span>{isDeceased ? t('employerFamily.markLiving') : t('employerFamily.markDeceased')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenuPersonId(null);
                    handleRemoveTreePerson(person);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-2 text-amber-700 dark:text-amber-400"
                >
                  <Trash2 size={14} />
                  <span>{t('employerFamily.tree.actions.removeMember')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          {person.birthYear && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Calendar size={12} className="text-gray-400" />
              <span>{t('employerFamily.birthYear')}: {person.birthYear}</span>
            </div>
          )}

          {/* Linked Family Member indicator */}
          {linkedMember && (
            <div className="flex items-center gap-1 text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md font-medium">
              <UserCheck size={11} />
              <span>{t('employerFamily.tabs.members')}</span>
            </div>
          )}

          {linkedMember?.neededServices && linkedMember.neededServices.length > 0 && !isDeceased && (
            <div className="flex flex-wrap gap-1 pt-1">
              {linkedMember.neededServices.slice(0, 2).map((svc, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] rounded font-medium"
                >
                  {svc}
                </span>
              ))}
              {linkedMember.neededServices.length > 2 && (
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded font-medium">
                  +{linkedMember.neededServices.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick context action bottom bar */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <button
            onClick={() => openQuickAddRelative(person, 'child')}
            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus size={13} />
            <span>{t('employerFamily.tree.actions.addChild')}</span>
          </button>

          <button
            onClick={() => openEditTreePersonModal(person)}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {t('employerFamily.edit')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="EMPLOYER">
      <div className="space-y-6">
        <RolePageHeader
          title={t('employerFamily.title')}
          subtitle={t('employerFamily.subtitle')}
          role="EMPLOYER"
        />

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'tree'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Layers size={16} />
              {t('employerFamily.tabs.tree')}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Users size={16} />
              {t('employerFamily.tabs.members')} ({members.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'tree' ? (
              <>
                {isPremium && unlinkedMembers.length > 0 && (
                  <button
                    onClick={openLinkMemberModal}
                    className="bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck size={16} />
                    <span className="hidden sm:inline">{t('employerFamily.tree.addExistingMemberBtn')}</span>
                    <span className="sm:hidden">{t('employerFamily.tree.addExistingMemberBtn')}</span>
                  </button>
                )}

                <button
                  onClick={openAddTreePersonModal}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">{t('employerFamily.tree.addPersonBtn')}</span>
                  <span className="sm:hidden">{t('employerFamily.tree.addMemberBtn')}</span>
                </button>

                {isPremium && treePeople.length >= 2 && (
                  <button
                    onClick={() => {
                      setRelFormData({
                        fromPersonId: treePeople[0]?.id || '',
                        toPersonId: treePeople[1]?.id || '',
                        relationshipType: 'parentOf'
                      });
                      setRelError('');
                      setIsRelModalOpen(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Heart size={16} />
                    <span className="hidden sm:inline">{t('employerFamily.tree.addRelationBtn')}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={openAddMemberModal}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">{t('employerFamily.addMemberBtn')}</span>
                <span className="sm:hidden">{t('employerFamily.addMemberTitle')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-teal-600 mb-3" size={32} />
            <p className="text-gray-500 text-sm">{t('employerFamily.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-6 rounded-2xl text-center">
            <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-red-700 dark:text-red-300 font-medium mb-3">{error}</p>
            <button
              onClick={loadFamilyData}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              {t('employerFamily.retry')}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: INTERACTIVE VISUAL FAMILY TREE */}
        {/* ============================================================ */}
        {!loading && !error && activeTab === 'tree' && (
          <div className="space-y-6">
            {!isPremium ? (
              /* PREMIUM LOCKED VIEW */
              <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
                  <Crown size={32} />
                </div>

                <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                  {t('employerFamily.tree.premiumBadge')}
                </span>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('employerFamily.tree.premiumTitle')}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed mb-8">
                  {t('employerFamily.tree.premiumDesc')}
                </p>

                {/* Benefits List */}
                <div className="max-w-md mx-auto grid gap-3 mb-8 text-left">
                  <div className="flex items-center gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="p-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                      <Check size={16} />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {t('employerFamily.tree.premiumBenefit1')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="p-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                      <Check size={16} />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {t('employerFamily.tree.premiumBenefit2')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="p-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                      <Check size={16} />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {t('employerFamily.tree.premiumBenefit3')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                  >
                    <Crown size={18} />
                    <span>{t('employerFamily.tree.upgradeBtn')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('members')}
                    className="w-full sm:w-auto px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-sm transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Users size={16} />
                    <span>{t('employerFamily.tabs.members')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header banner */}
                <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="max-w-2xl relative z-10">
                    <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      <Sparkles size={14} />
                      <span>{t('employerFamily.title')}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t('employerFamily.tree.headerTitle')}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {t('employerFamily.tree.headerDesc')}
                    </p>
                  </div>
                </div>

            {/* Empty state: 0 tree people */}
            {treePeople.length === 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={32} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('employerFamily.tree.emptyTreeTitle')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {t('employerFamily.tree.emptyTreeDesc')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {unlinkedMembers.length > 0 && (
                    <button
                      onClick={openLinkMemberModal}
                      className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-md"
                    >
                      <UserCheck size={18} />
                      {t('employerFamily.tree.addExistingMemberBtn')}
                    </button>
                  )}
                  <button
                    onClick={openAddTreePersonModal}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-md"
                  >
                    <UserPlus size={18} />
                    {t('employerFamily.tree.addMemberBtn')}
                  </button>
                </div>
              </div>
            )}

            {/* Tree Container with Generations */}
            {treePeople.length > 0 && (
              <div className="bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-inner overflow-x-auto min-h-[420px]">
                <div className="min-w-[680px] max-w-5xl mx-auto space-y-10">

                  {/* GENERATION 1: GRANDPARENTS */}
                  {treeGenerations.grandparents.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                          {t('employerFamily.tree.generations.grandparents')}
                        </span>
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {treeGenerations.grandparents.map(renderTreePersonCard)}
                      </div>
                      <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 mx-auto mt-4" />
                    </div>
                  )}

                  {/* GENERATION 2: PARENTS / CORE */}
                  {treeGenerations.parents.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 shadow-sm">
                          {t('employerFamily.tree.generations.parents')}
                        </span>
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {treeGenerations.parents.map(renderTreePersonCard)}
                      </div>
                      {treeGenerations.children.length > 0 && (
                        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 mx-auto mt-4" />
                      )}
                    </div>
                  )}

                  {/* GENERATION 3: CHILDREN */}
                  {treeGenerations.children.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm">
                          {t('employerFamily.tree.generations.children')}
                        </span>
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {treeGenerations.children.map(renderTreePersonCard)}
                      </div>
                      {treeGenerations.grandchildren.length > 0 && (
                        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 mx-auto mt-4" />
                      )}
                    </div>
                  )}

                  {/* GENERATION 4: GRANDCHILDREN */}
                  {treeGenerations.grandchildren.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 shadow-sm">
                          {t('employerFamily.tree.generations.grandchildren')}
                        </span>
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {treeGenerations.grandchildren.map(renderTreePersonCard)}
                      </div>
                    </div>
                  )}

                  {/* EXTENDED HOUSEHOLD */}
                  {treeGenerations.extended.length > 0 && (
                    <div className="relative pt-6 border-t border-dashed border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                          {t('employerFamily.tree.generations.extended')}
                        </span>
                        <span className="h-px bg-slate-300 dark:bg-slate-700 w-16" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {treeGenerations.extended.map(renderTreePersonCard)}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Active Relationships summary footer */}
            {treePeople.length >= 2 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    {t('employerFamily.tree.recordedRelationships')} ({relationships.length})
                  </h4>
                  <button
                    onClick={() => {
                      setRelFormData({
                        fromPersonId: treePeople[0]?.id || '',
                        toPersonId: treePeople[1]?.id || '',
                        relationshipType: 'parentOf'
                      });
                      setRelError('');
                      setIsRelModalOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    {t('employerFamily.tree.addRelationBtn')}
                  </button>
                </div>

                {relationships.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    {t('employerFamily.tree.noRelationsHint')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {relationships.map(rel => (
                      <div
                        key={rel.id}
                        className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs"
                      >
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {getPersonName(rel.fromPersonId || rel.fromMemberId)}
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 font-medium">
                          {t(`employerFamily.tree.${rel.relationshipType}`, { defaultValue: rel.relationshipType })}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {getPersonName(rel.toPersonId || rel.toMemberId)}
                        </span>
                        <button
                          onClick={() => handleDeleteRelationship(rel.id)}
                          className="text-gray-400 hover:text-red-500 ml-1"
                          title={t('employerFamily.delete')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: FAMILY MEMBERS LIST */}
        {/* ============================================================ */}
        {!loading && !error && activeTab === 'members' && (
          <>
            {members.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('employerFamily.emptyTitle')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {t('employerFamily.emptyDesc')}
                </p>
                <button
                  onClick={openAddMemberModal}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-md"
                >
                  <UserPlus size={18} />
                  {t('employerFamily.addFirstMember')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div
                    key={member.id}
                    className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${
                      member.isDeceased
                        ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                            member.isDeceased
                              ? 'bg-slate-500'
                              : 'bg-gradient-to-br from-teal-500 to-teal-700'
                          }`}>
                            {member.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                {member.firstName}
                              </h4>
                              {member.isDeceased && (
                                <span className="bg-slate-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {t('employerFamily.deceased')}
                                </span>
                              )}
                            </div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 capitalize">
                              {t(`employerFamily.relationships.${member.relationship}`, { defaultValue: member.relationship })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditMemberModal(member)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                            title={t('employerFamily.edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleArchiveMember(member.id, member.firstName)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('employerFamily.archive')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {member.birthYear && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{t('employerFamily.birthYear')}: {member.birthYear}</span>
                        </div>
                      )}

                      {/* Services Needed Tags */}
                      {member.neededServices && member.neededServices.length > 0 && !member.isDeceased && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            {t('employerFamily.servicesNeeded')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {member.neededServices.map((service, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Privacy-safe Care Notes summary */}
                      {member.careNotes && (
                        <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl mb-4">
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                            "{member.careNotes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                      <button
                        onClick={() => navigate('/employer-search')}
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
                      >
                        <Briefcase size={14} />
                        {t('employerFamily.findServices')}
                        <ChevronRight size={14} />
                      </button>

                      <button
                        onClick={() => handleToggleMemberDeceased(member)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {member.isDeceased ? t('employerFamily.markLiving') : t('employerFamily.markDeceased')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* ADD / EDIT FAMILY MEMBER MODAL (FREE CONTACTS/CARE LIST) */}
        {/* ============================================================ */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {editingMember ? t('employerFamily.editMemberTitle') : t('employerFamily.addMemberTitle')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 text-sm rounded-lg">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.firstName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={t('employerFamily.placeholders.firstName')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('employerFamily.hints.privacyName')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.relationship')} *
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {RELATIONSHIP_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.birthYear')}
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.birthYear}
                      onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                      placeholder="e.g. 2016"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Deceased Checkbox */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isDeceasedCheckbox"
                    checked={formData.isDeceased}
                    onChange={e => setFormData({ ...formData, isDeceased: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <label htmlFor="isDeceasedCheckbox" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    {t('employerFamily.fields.isDeceased')} ({t('employerFamily.deceased')})
                  </label>
                </div>

                {!formData.isDeceased && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">
                      {t('employerFamily.fields.neededServices')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_OPTIONS.map(svc => {
                        const selected = formData.neededServices.includes(svc);
                        return (
                          <button
                            type="button"
                            key={svc}
                            onClick={() => handleToggleService(svc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {svc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.careNotes')}
                  </label>
                  <textarea
                    rows="3"
                    value={formData.careNotes}
                    onChange={e => setFormData({ ...formData, careNotes: e.target.value })}
                    placeholder={t('employerFamily.placeholders.careNotes')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('employerFamily.hints.careNotesHint')}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {t('employerFamily.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {modalSubmitting && <Loader2 className="animate-spin" size={16} />}
                    {editingMember ? t('employerFamily.saveChanges') : t('employerFamily.addMemberBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ADD / EDIT TREE PERSON MODAL (PREMIUM GENEALOGY NODE) */}
        {/* ============================================================ */}
        {isTreePersonModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Crown size={18} className="text-amber-500" />
                    {editingTreePerson ? t('employerFamily.editMemberTitle') : t('employerFamily.tree.addPersonToTree')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('employerFamily.tree.treeSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setIsTreePersonModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {treePersonError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 text-sm rounded-lg">
                  {treePersonError}
                </div>
              )}

              <form onSubmit={handleSaveTreePerson} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.firstName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={treePersonFormData.firstName}
                    onChange={e => setTreePersonFormData({ ...treePersonFormData, firstName: e.target.value })}
                    placeholder={t('employerFamily.placeholders.firstName')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.relationship')} *
                    </label>
                    <select
                      value={treePersonFormData.role}
                      onChange={e => setTreePersonFormData({ ...treePersonFormData, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {RELATIONSHIP_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.birthYear')}
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={treePersonFormData.birthYear}
                      onChange={e => setTreePersonFormData({ ...treePersonFormData, birthYear: e.target.value })}
                      placeholder="e.g. 1990"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Deceased Checkbox */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="treePersonDeceasedCheckbox"
                    checked={treePersonFormData.isDeceased}
                    onChange={e => setTreePersonFormData({ ...treePersonFormData, isDeceased: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <label htmlFor="treePersonDeceasedCheckbox" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    {t('employerFamily.fields.isDeceased')} ({t('employerFamily.deceased')})
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.careNotes')}
                  </label>
                  <textarea
                    rows="2"
                    value={treePersonFormData.careNotes}
                    onChange={e => setTreePersonFormData({ ...treePersonFormData, careNotes: e.target.value })}
                    placeholder={t('employerFamily.placeholders.careNotes')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTreePersonModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {t('employerFamily.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={treePersonSubmitting}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {treePersonSubmitting && <Loader2 className="animate-spin" size={16} />}
                    {editingTreePerson ? t('employerFamily.saveChanges') : t('employerFamily.tree.addPersonToTree')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LINK EXISTING FAMILY MEMBER TO TREE MODAL (PREMIUM) */}
        {/* ============================================================ */}
        {isLinkMemberModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus size={18} className="text-teal-600" />
                  {t('employerFamily.tree.addExistingMemberTitle')}
                </h3>
                <button
                  onClick={() => setIsLinkMemberModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {linkMemberError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                  {linkMemberError}
                </div>
              )}

              {unlinkedMembers.length === 0 ? (
                <div className="py-6 text-center">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('employerFamily.tree.noUnlinkedMembers')}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkMemberModalOpen(false)}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      {t('employerFamily.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLinkExistingMemberToTree} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.tree.selectMemberToLink')}
                    </label>
                    <select
                      value={selectedMemberIdToLink}
                      onChange={e => setSelectedMemberIdToLink(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-teal-500"
                    >
                      {unlinkedMembers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} ({t(`employerFamily.relationships.${m.relationship}`, { defaultValue: m.relationship })})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkMemberModalOpen(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      {t('employerFamily.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={linkMemberSubmitting || !selectedMemberIdToLink}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {linkMemberSubmitting && <Loader2 className="animate-spin" size={14} />}
                      {t('employerFamily.tree.addExistingMemberBtn')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* QUICK ADD RELATIVE MODAL (Contextual from tree node) */}
        {/* ============================================================ */}
        {isQuickAddModalOpen && quickAddAnchorPerson && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {t(`employerFamily.tree.actions.add${quickAddRelType.charAt(0).toUpperCase() + quickAddRelType.slice(1)}`, { defaultValue: `Add ${quickAddRelType}` })}
                  </h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                    Connecting to: <strong>{quickAddAnchorPerson.firstName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {quickAddError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 text-sm rounded-lg">
                  {quickAddError}
                </div>
              )}

              <form onSubmit={handleSaveQuickAddRelative} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.firstName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAddFormData.firstName}
                    onChange={e => setQuickAddFormData({ ...quickAddFormData, firstName: e.target.value })}
                    placeholder={t('employerFamily.placeholders.firstName')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('employerFamily.hints.privacyName')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.relationship')}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={t(`employerFamily.relationships.${quickAddRelType}`, { defaultValue: quickAddRelType })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                      {t('employerFamily.fields.birthYear')}
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={quickAddFormData.birthYear}
                      onChange={e => setQuickAddFormData({ ...quickAddFormData, birthYear: e.target.value })}
                      placeholder="e.g. 2024"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Deceased Toggle */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="quickAddDeceasedCheckbox"
                    checked={quickAddFormData.isDeceased}
                    onChange={e => setQuickAddFormData({ ...quickAddFormData, isDeceased: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <label htmlFor="quickAddDeceasedCheckbox" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    {t('employerFamily.fields.isDeceased')} ({t('employerFamily.deceased')})
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.fields.careNotes')}
                  </label>
                  <textarea
                    rows="2"
                    value={quickAddFormData.careNotes}
                    onChange={e => setQuickAddFormData({ ...quickAddFormData, careNotes: e.target.value })}
                    placeholder={t('employerFamily.placeholders.careNotes')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {t('employerFamily.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={quickAddSubmitting}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {quickAddSubmitting && <Loader2 className="animate-spin" size={16} />}
                    {t('employerFamily.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ADD RELATIONSHIP MODAL (TREE PERSONS) */}
        {/* ============================================================ */}
        {isRelModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {t('employerFamily.tree.addRelationTitle')}
                </h3>
                <button
                  onClick={() => setIsRelModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {relError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                  {relError}
                </div>
              )}

              <form onSubmit={handleSaveRelationship} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.tree.fromPerson')}
                  </label>
                  <select
                    value={relFormData.fromPersonId}
                    onChange={e => setRelFormData({ ...relFormData, fromPersonId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    <option value="">{t('employerFamily.tree.selectMemberToLink')}</option>
                    {treePeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} ({t(`employerFamily.relationships.${p.role}`, { defaultValue: p.role })})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.tree.relationshipType')}
                  </label>
                  <select
                    value={relFormData.relationshipType}
                    onChange={e => setRelFormData({ ...relFormData, relationshipType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    {TREE_REL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    {t('employerFamily.tree.toPerson')}
                  </label>
                  <select
                    value={relFormData.toPersonId}
                    onChange={e => setRelFormData({ ...relFormData, toPersonId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    <option value="">{t('employerFamily.tree.selectMemberToLink')}</option>
                    {treePeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} ({t(`employerFamily.relationships.${p.role}`, { defaultValue: p.role })})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRelModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    {t('employerFamily.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={relSubmitting}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {relSubmitting && <Loader2 className="animate-spin" size={14} />}
                    {t('employerFamily.tree.saveRelation')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployerFamily;
