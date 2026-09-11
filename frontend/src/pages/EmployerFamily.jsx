// src/pages/EmployerFamily.jsx — Employer "My Family" Page
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import familyService from '../services/familyService';
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
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  X
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

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'tree'
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    relationship: 'child',
    birthYear: '',
    careNotes: '',
    neededServices: []
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Relationship Modal State
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [relFormData, setRelFormData] = useState({
    fromMemberId: '',
    toMemberId: '',
    relationshipType: 'parentOf'
  });
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relError, setRelError] = useState('');

  // Auth gate
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }
  }, [authLoading, isAuthenticated, authUser, navigate]);

  const loadFamilyData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [membersRes, relRes] = await Promise.allSettled([
        familyService.getFamilyMembers(false),
        familyService.getFamilyRelationships()
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.success) {
        setMembers(membersRes.value.members || []);
      } else {
        setError(t('employerFamily.loadError'));
      }

      if (relRes.status === 'fulfilled' && relRes.value?.success) {
        setRelationships(relRes.value.relationships || []);
      }
    } catch (err) {
      console.error('Failed to load family data:', err);
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

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      relationship: 'child',
      birthYear: '',
      careNotes: '',
      neededServices: []
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      relationship: member.relationship || 'other',
      birthYear: member.birthYear ? String(member.birthYear) : '',
      careNotes: member.careNotes || '',
      neededServices: member.neededServices || []
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
        neededServices: formData.neededServices
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
        setRelationships(prev => prev.filter(r => r.fromMemberId !== id && r.toMemberId !== id));
        setSuccessMsg(t('employerFamily.memberArchived'));
      }
    } catch (err) {
      console.error('Archive member error:', err);
      alert(t('employerFamily.archiveError'));
    }
  };

  const handleSaveRelationship = async (e) => {
    e.preventDefault();
    setRelError('');

    if (!relFormData.fromMemberId || !relFormData.toMemberId) {
      setRelError(t('employerFamily.tree.selectBothMembers'));
      return;
    }
    if (relFormData.fromMemberId === relFormData.toMemberId) {
      setRelError(t('employerFamily.tree.cannotLinkSelf'));
      return;
    }

    setRelSubmitting(true);
    try {
      const res = await familyService.createFamilyRelationship(relFormData);
      if (res?.success) {
        setRelationships(prev => {
          const filtered = prev.filter(r => !(r.fromMemberId === relFormData.fromMemberId && r.toMemberId === relFormData.toMemberId && r.relationshipType === relFormData.relationshipType));
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
      const res = await familyService.deleteFamilyRelationship(id);
      if (res?.success) {
        setRelationships(prev => prev.filter(r => r.id !== id));
        setSuccessMsg(t('employerFamily.tree.relationDeleted'));
      }
    } catch (err) {
      console.error('Delete relationship error:', err);
    }
  };

  const getMemberName = (id) => {
    const member = members.find(m => m.id === id);
    return member ? member.firstName : t('employerFamily.unknownMember');
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
          </div>

          {activeTab === 'members' && (
            <button
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <UserPlus size={16} />
              {t('employerFamily.addMemberBtn')}
            </button>
          )}

          {activeTab === 'tree' && members.length >= 2 && (
            <button
              onClick={() => {
                setRelFormData({
                  fromMemberId: members[0]?.id || '',
                  toMemberId: members[1]?.id || '',
                  relationshipType: 'parentOf'
                });
                setRelError('');
                setIsRelModalOpen(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Heart size={16} />
              {t('employerFamily.tree.addRelationBtn')}
            </button>
          )}
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
        {/* TAB 1: FAMILY MEMBERS LIST */}
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
                  onClick={openAddModal}
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
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                            {member.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-base">
                              {member.firstName}
                            </h4>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 capitalize">
                              {t(`employerFamily.relationships.${member.relationship}`, { defaultValue: member.relationship })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(member)}
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
                      {member.neededServices && member.neededServices.length > 0 && (
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: FAMILY TREE FOUNDATION */}
        {/* ============================================================ */}
        {!loading && !error && activeTab === 'tree' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold mb-3 border border-teal-500/30">
                  <ShieldCheck size={14} />
                  {t('employerFamily.tree.foundationBadge')}
                </div>
                <h3 className="text-xl font-bold mb-2">{t('employerFamily.tree.foundationTitle')}</h3>
                <p className="text-sm text-gray-300">
                  {t('employerFamily.tree.foundationDesc')}
                </p>
              </div>
            </div>

            {members.length < 2 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center shadow-sm">
                <Layers className="mx-auto text-gray-400 mb-3" size={32} />
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                  {t('employerFamily.tree.needMoreMembersTitle')}
                </h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                  {t('employerFamily.tree.needMoreMembersDesc')}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('members');
                    openAddModal();
                  }}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
                >
                  {t('employerFamily.addMemberBtn')}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    {t('employerFamily.tree.recordedRelationships')} ({relationships.length})
                  </h4>
                  <button
                    onClick={() => {
                      setRelFormData({
                        fromMemberId: members[0]?.id || '',
                        toMemberId: members[1]?.id || '',
                        relationshipType: 'parentOf'
                      });
                      setRelError('');
                      setIsRelModalOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    + {t('employerFamily.tree.addRelationBtn')}
                  </button>
                </div>

                {relationships.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {t('employerFamily.tree.noRelationsYet')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('employerFamily.tree.noRelationsHint')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {relationships.map(rel => (
                      <div
                        key={rel.id}
                        className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 flex items-center justify-between"
                      >
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {getMemberName(rel.fromMemberId)}
                          </span>
                          <span className="mx-2 text-xs px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-medium">
                            {t(`employerFamily.tree.${rel.relationshipType}`, { defaultValue: rel.relationshipType })}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {getMemberName(rel.toMemberId)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteRelationship(rel.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                          title={t('employerFamily.delete')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ADD / EDIT MEMBER MODAL */}
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
        {/* ADD RELATIONSHIP MODAL */}
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
                  className="text-gray-400 hover:text-gray-600"
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
                    {t('employerFamily.tree.fromMember')}
                  </label>
                  <select
                    value={relFormData.fromMemberId}
                    onChange={e => setRelFormData({ ...relFormData, fromMemberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} ({t(`employerFamily.relationships.${m.relationship}`, { defaultValue: m.relationship })})
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
                    {t('employerFamily.tree.toMember')}
                  </label>
                  <select
                    value={relFormData.toMemberId}
                    onChange={e => setRelFormData({ ...relFormData, toMemberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} ({t(`employerFamily.relationships.${m.relationship}`, { defaultValue: m.relationship })})
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
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded flex items-center gap-1"
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
