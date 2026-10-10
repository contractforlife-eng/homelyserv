// frontend/src/pages/TeacherCourses.jsx
// ============================================================
// TEACHER RECORDED COURSES PAGE (HomelyServ LMS Phase 1)
// ============================================================
// Teachers can create, edit, manage, and publish their recorded courses
// without requiring Premium. Supports ordered YouTube video lessons.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import { TEACHER_SUBJECTS, TEACHING_LEVELS } from '../constants/teacherTaxonomy';
import api from '../utils/api';
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Lock,
  Upload,
  Play,
  ArrowUp,
  ArrowDown,
  Clock,
  DollarSign,
  Search,
  FileText,
  Download
} from 'lucide-react';
import { triggerFileDownload, formatFileSize } from '../utils/fileDownload';

const TeacherCourses = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PUBLISHED, DRAFT

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'mathematics',
    gradeLevel: 'secondary',
    gradeSubtitle: '',
    thumbnailUrl: '',
    isPaid: false,
    price: 0,
    currency: 'EGP',
    lessons: []
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [activePreviewVideoId, setActivePreviewVideoId] = useState(null);

  // Lesson inline form state inside modal
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    durationMinutes: 10
  });
  const [lessonError, setLessonError] = useState('');

  // Course Materials Modal state
  const [materialsModalCourse, setMaterialsModalCourse] = useState(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialDeletingId, setMaterialDeletingId] = useState(null);
  const [materialDownloadingId, setMaterialDownloadingId] = useState(null);
  const [materialError, setMaterialError] = useState('');
  const [materialSuccess, setMaterialSuccess] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/teachers/courses');
      if (res.data?.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      subject: 'mathematics',
      gradeLevel: 'secondary',
      gradeSubtitle: '',
      thumbnailUrl: '',
      isPaid: false,
      price: 0,
      currency: 'EGP',
      lessons: []
    });
    setFormError('');
    setLessonError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      subject: course.subject || 'mathematics',
      gradeLevel: course.gradeLevel || 'secondary',
      gradeSubtitle: course.gradeSubtitle || '',
      thumbnailUrl: course.thumbnailUrl || '',
      isPaid: Boolean(course.isPaid),
      price: course.price || 0,
      currency: course.currency || 'EGP',
      lessons: (course.lessons || []).map((l, i) => ({
        ...l,
        order: l.order || i + 1
      }))
    });
    setFormError('');
    setLessonError('');
    setIsModalOpen(true);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      setFormError('');
      const data = new FormData();
      data.append('thumbnail', file);

      const res = await api.post('/api/teachers/courses/upload-thumbnail', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.thumbnailUrl) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: res.data.thumbnailUrl }));
      }
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      setFormError(t('teacherCourses.form.uploadError') || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Add lesson to list
  const handleAddLesson = () => {
    setLessonError('');
    if (!lessonForm.title.trim()) {
      setLessonError(t('teacherCourses.form.lessonTitleRequired') || 'Lesson title is required');
      return;
    }
    if (!lessonForm.youtubeUrl.trim()) {
      setLessonError(t('teacherCourses.form.lessonUrlRequired') || 'YouTube URL is required');
      return;
    }

    // Basic client validation of YouTube URL
    const ytRegex =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!ytRegex.test(lessonForm.youtubeUrl.trim())) {
      setLessonError(
        t('teacherCourses.form.invalidYoutubeUrl') || 'Please enter a valid YouTube video link'
      );
      return;
    }

    const nextOrder = formData.lessons.length + 1;
    setFormData((prev) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          _id: `temp-${Date.now()}`,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim(),
          youtubeUrl: lessonForm.youtubeUrl.trim(),
          durationMinutes: Math.max(0, Number(lessonForm.durationMinutes) || 0),
          order: nextOrder
        }
      ]
    }));

    setLessonForm({
      title: '',
      description: '',
      youtubeUrl: '',
      durationMinutes: 10
    });
  };

  const handleRemoveLesson = (index) => {
    setFormData((prev) => {
      const nextLessons = prev.lessons.filter((_, i) => i !== index);
      return {
        ...prev,
        lessons: nextLessons.map((l, i) => ({ ...l, order: i + 1 }))
      };
    });
  };

  const handleMoveLesson = (index, direction) => {
    setFormData((prev) => {
      const lessons = [...prev.lessons];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= lessons.length) return prev;

      const temp = lessons[index];
      lessons[index] = lessons[targetIndex];
      lessons[targetIndex] = temp;

      return {
        ...prev,
        lessons: lessons.map((l, i) => ({ ...l, order: i + 1 }))
      };
    });
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError(t('teacherCourses.form.titleRequired') || 'Course title is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        gradeSubtitle: formData.gradeSubtitle.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        isPaid: Boolean(formData.isPaid),
        price: formData.isPaid ? Math.max(0, Number(formData.price) || 0) : 0,
        currency: formData.currency.trim().toUpperCase() || 'EGP',
        lessons: formData.lessons.map((lesson) => {
          const item = { ...lesson };
          if (typeof item._id === 'string' && item._id.startsWith('temp-')) {
            delete item._id;
          }
          return item;
        })
      };

      if (editingCourse) {
        await api.put(`/api/teachers/courses/${editingCourse._id}`, payload);
      } else {
        await api.post('/api/teachers/courses', payload);
      }

      setIsModalOpen(false);
      await fetchCourses();
    } catch (err) {
      console.error('Error saving course:', err);
      setFormError(err.response?.data?.message || t('teacherCourses.form.saveError') || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await api.patch(`/api/teachers/courses/${course._id}/publish`, {
        isPublished: !course.isPublished
      });
      await fetchCourses();
    } catch (err) {
      console.error('Error toggling publish state:', err);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/api/teachers/courses/${courseId}`);
      setDeleteConfirmId(null);
      await fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleOpenMaterialsModal = (course) => {
    setMaterialsModalCourse(course);
    setMaterialTitle('');
    setMaterialFile(null);
    setMaterialError('');
    setMaterialSuccess('');
  };

  const handleUploadMaterial = async (e) => {
    e?.preventDefault();
    if (!materialsModalCourse) return;
    setMaterialError('');
    setMaterialSuccess('');

    if (!materialTitle.trim()) {
      setMaterialError(t('teacherCourses.materials.titleRequired') || 'Material title is required.');
      return;
    }

    if (!materialFile) {
      setMaterialError(t('teacherCourses.materials.pdfOnlyError') || 'Only authentic PDF documents (.pdf) are allowed.');
      return;
    }

    // Client-side 10MB limit enforcement
    if (materialFile.size > 10 * 1024 * 1024) {
      setMaterialError(t('teacherCourses.materials.maxSizeError') || 'File size exceeds the 10MB limit.');
      return;
    }

    // Client-side extension validation
    if (!materialFile.name.toLowerCase().endsWith('.pdf')) {
      setMaterialError(t('teacherCourses.materials.pdfOnlyError') || 'Only authentic PDF documents (.pdf) are allowed.');
      return;
    }

    try {
      setMaterialUploading(true);
      const data = new FormData();
      data.append('title', materialTitle.trim());
      data.append('file', materialFile);

      const res = await api.post(`/api/teachers/courses/${materialsModalCourse._id}/materials`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.material) {
        setMaterialSuccess(t('teacherCourses.materials.uploadSuccess') || 'Material uploaded successfully.');
        setMaterialTitle('');
        setMaterialFile(null);

        // Update local modal state and courses list
        const updatedMaterials = [...(materialsModalCourse.materials || []), res.data.material];
        setMaterialsModalCourse((prev) => ({
          ...prev,
          materials: updatedMaterials
        }));
        setCourses((prev) =>
          prev.map((c) => (c._id === materialsModalCourse._id ? { ...c, materials: updatedMaterials } : c))
        );
      } else {
        setMaterialError(res.data?.message || t('teacherCourses.materials.uploadError') || 'Failed to upload material.');
      }
    } catch (err) {
      console.error('Error uploading course material:', err);
      setMaterialError(err.response?.data?.message || t('teacherCourses.materials.uploadError') || 'Failed to upload material.');
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!materialsModalCourse) return;
    const confirmed = window.confirm(t('teacherCourses.materials.deleteConfirm') || 'Are you sure you want to delete this material?');
    if (!confirmed) return;

    setMaterialError('');
    setMaterialSuccess('');
    try {
      setMaterialDeletingId(materialId);
      const res = await api.delete(`/api/teachers/courses/${materialsModalCourse._id}/materials/${materialId}`);
      if (res.data?.success) {
        setMaterialSuccess(t('teacherCourses.materials.deleteSuccess') || 'Material deleted successfully.');
        const updatedMaterials = (materialsModalCourse.materials || []).filter(
          (m) => String(m._id) !== String(materialId)
        );
        setMaterialsModalCourse((prev) => ({
          ...prev,
          materials: updatedMaterials
        }));
        setCourses((prev) =>
          prev.map((c) => (c._id === materialsModalCourse._id ? { ...c, materials: updatedMaterials } : c))
        );
      } else {
        setMaterialError(res.data?.message || t('teacherCourses.materials.deleteError') || 'Failed to delete material.');
      }
    } catch (err) {
      console.error('Error deleting course material:', err);
      setMaterialError(err.response?.data?.message || t('teacherCourses.materials.deleteError') || 'Failed to delete material.');
    } finally {
      setMaterialDeletingId(null);
    }
  };

  const handleDownloadMaterial = async (materialId, originalFilename) => {
    if (!materialsModalCourse) return;
    setMaterialError('');
    try {
      setMaterialDownloadingId(materialId);
      const res = await api.get(`/api/teachers/courses/${materialsModalCourse._id}/materials/${materialId}/download`);
      if (res.data?.success && res.data.downloadUrl) {
        await triggerFileDownload(res.data.downloadUrl, originalFilename || res.data.material?.originalFilename || 'material.pdf');
      } else {
        setMaterialError(res.data?.message || t('teacherCourses.materials.downloadError') || 'Failed to generate download link.');
      }
    } catch (err) {
      console.error('Error downloading course material:', err);
      setMaterialError(err.response?.data?.message || t('teacherCourses.materials.downloadError') || 'Failed to generate download link.');
    } finally {
      setMaterialDownloadingId(null);
    }
  };

  // Filtered list
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (subjectFilter !== 'ALL' && c.subject !== subjectFilter) return false;
      if (statusFilter === 'PUBLISHED' && !c.isPublished) return false;
      if (statusFilter === 'DRAFT' && c.isPublished) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = c.title?.toLowerCase().includes(query);
        const descMatch = c.description?.toLowerCase().includes(query);
        const gradeMatch = c.gradeSubtitle?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !gradeMatch) return false;
      }
      return true;
    });
  }, [courses, subjectFilter, statusFilter, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <DashboardHeader
          title={t('teacherCourses.title') || 'Recorded Courses'}
        />

        {/* Filters and search bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('teacherCourses.searchPlaceholder') || 'Search courses...'}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">{t('teacherCourses.allSubjects') || 'All Subjects'}</option>
                {TEACHER_SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.labelKey) || s.value}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">{t('teacherCourses.allStatuses') || 'All Statuses'}</option>
                <option value="PUBLISHED">{t('teacherCourses.published') || 'Published'}</option>
                <option value="DRAFT">{t('teacherCourses.draft') || 'Draft / Unpublished'}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('teacherCourses.createBtn') || 'New Course'}</span>
          </button>
        </div>

        {/* Courses list */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            icon={Video}
            title={t('teacherCourses.emptyTitle') || 'No recorded courses found'}
            description={t('teacherCourses.emptyDesc') || 'Create your first course to share your video lessons with students.'}
            action={
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('teacherCourses.createFirstBtn') || 'Create Course'}</span>
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const totalLessons = course.lessons?.length || 0;
              const totalMinutes =
                course.lessons?.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0) || 0;

              return (
                <div
                  key={course._id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail banner */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-50 to-amber-100">
                          <Video className="w-12 h-12 text-amber-400" />
                        </div>
                      )}

                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            course.isPublished
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-800 text-gray-200'
                          }`}
                        >
                          {course.isPublished
                            ? t('teacherCourses.published') || 'Published'
                            : t('teacherCourses.draft') || 'Draft'}
                        </span>
                        {course.isPaid ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-600 text-white flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>
                              {course.price} {course.currency || 'EGP'}
                            </span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                            {t('teacherCourses.free') || 'Free'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {t(`teacherTaxonomy.subjects.${course.subject}`) || course.subject}
                        </span>
                        <span>{t(`teacherTaxonomy.levels.${course.gradeLevel}`) || course.gradeLevel}</span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
                        {course.title}
                      </h3>

                      {course.gradeSubtitle && (
                        <p className="text-xs text-gray-500">{course.gradeSubtitle}</p>
                      )}

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {course.description || t('teacherCourses.noDescription') || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {totalLessons} {t('teacherCourses.lessonsCount') || 'lessons'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {totalMinutes} {t('teacherCourses.minutes') || 'mins'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setPreviewCourse(course)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('teacherCourses.preview') || 'Preview'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenMaterialsModal(course)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors inline-flex items-center gap-1.5 border border-amber-200/60"
                        title={t('teacherCourses.materials.title') || 'Course PDF Materials'}
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {t('teacherCourses.materials.manageMaterialsBtn', {
                            count: course.materials?.length || 0
                          }) || `Manage PDF Materials (${course.materials?.length || 0})`}
                        </span>
                      </button>

                      <button
                        onClick={() => handleTogglePublish(course)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          course.isPublished
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {course.isPublished
                          ? t('teacherCourses.unpublishBtn') || 'Unpublish'
                          : t('teacherCourses.publishBtn') || 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(course)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title={t('teacherCourses.editBtn') || 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(course._id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title={t('teacherCourses.deleteBtn') || 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-semibold text-lg text-gray-900">
                  {t('teacherCourses.deleteModal.title') || 'Delete Course?'}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('teacherCourses.deleteModal.message') ||
                  'Are you sure you want to permanently delete this course? This action cannot be undone.'}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('teacherCourses.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => handleDeleteCourse(deleteConfirmId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {t('teacherCourses.confirmDelete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Preview Modal */}
        {previewCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewCourse.title}</h3>
                  <p className="text-sm text-gray-500">
                    {t(`teacherTaxonomy.subjects.${previewCourse.subject}`)} •{' '}
                    {t(`teacherTaxonomy.levels.${previewCourse.gradeLevel}`)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPreviewCourse(null);
                    setActivePreviewVideoId(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              {activePreviewVideoId ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activePreviewVideoId}?autoplay=1&rel=0`}
                    title="Course Preview Player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-white p-6">
                  <Play className="w-16 h-16 text-amber-500 mb-2 opacity-80" />
                  <p className="text-sm text-gray-300">
                    {t('teacherCourses.selectLessonToWatch') || 'Select a lesson from the curriculum below to preview'}
                  </p>
                </div>
              )}

              {/* Curriculum */}
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {t('teacherCourses.curriculum') || 'Curriculum'} ({previewCourse.lessons?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {previewCourse.lessons?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {t('teacherCourses.noLessonsYet') || 'No lessons added yet.'}
                    </div>
                  ) : (
                    previewCourse.lessons?.map((l) => (
                      <div
                        key={l._id}
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          activePreviewVideoId === l.youtubeVideoId ? 'bg-amber-50/50' : ''
                        }`}
                        onClick={() => setActivePreviewVideoId(l.youtubeVideoId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center justify-center">
                            {l.order}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{l.title}</div>
                            {l.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">{l.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{l.durationMinutes} mins</span>
                          <Play className="w-4 h-4 text-amber-600" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Course Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCourse
                    ? t('teacherCourses.form.editTitle') || 'Edit Course'
                    : t('teacherCourses.form.createTitle') || 'Create New Course'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCourse} className="space-y-6">
                {/* Basic Metadata */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {t('teacherCourses.form.basicInfo') || 'Basic Information'}
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.form.titleLabel') || 'Course Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Complete High School Physics"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('teacherCourses.form.subjectLabel') || 'Subject *'}
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      >
                        {TEACHER_SUBJECTS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {t(s.labelKey) || s.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('teacherCourses.form.gradeLevelLabel') || 'Education Level *'}
                      </label>
                      <select
                        value={formData.gradeLevel}
                        onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      >
                        {TEACHING_LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {t(l.labelKey) || l.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.form.gradeSubtitleLabel') || 'Grade / Subtitle (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.gradeSubtitle}
                      onChange={(e) => setFormData({ ...formData, gradeSubtitle: e.target.value })}
                      placeholder="e.g. 1st Secondary Term 1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.form.descriptionLabel') || 'Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What will students learn in this recorded course?"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Thumbnail upload */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.form.thumbnailLabel') || 'Course Thumbnail Image'}
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.thumbnailUrl ? (
                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img
                            src={formData.thumbnailUrl}
                            alt="Course Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                            className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded hover:bg-black"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}

                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        {uploadingThumbnail ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-500" />
                        )}
                        <span>
                          {uploadingThumbnail
                            ? t('teacherCourses.form.uploading') || 'Uploading...'
                            : t('teacherCourses.form.uploadBtn') || 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                          disabled={uploadingThumbnail}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing Structure */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {t('teacherCourses.form.pricingSection') || 'Pricing'}
                  </h4>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPaidCheckbox"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <label htmlFor="isPaidCheckbox" className="text-sm font-medium text-gray-800">
                      {t('teacherCourses.form.isPaidLabel') || 'Paid Course'}
                    </label>
                  </div>

                  {formData.isPaid && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('teacherCourses.form.priceLabel') || 'Course Price'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('teacherCourses.form.currencyLabel') || 'Currency'}
                        </label>
                        <input
                          type="text"
                          value={formData.currency}
                          onChange={(e) =>
                            setFormData({ ...formData, currency: e.target.value.toUpperCase() })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                        />
                      </div>
                      <p className="text-xs text-amber-700 col-span-full">
                        {t('teacherCourses.form.paidNotice') ||
                          'Note: Paid course checkout will be activated in Phase 2. Paid courses are currently locked for public enrolled playback.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lessons / Curriculum */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t('teacherCourses.form.lessonsSection') || 'Lessons / Curriculum'} (
                      {formData.lessons.length})
                    </h4>
                  </div>

                  {/* Existing lessons list */}
                  {formData.lessons.length > 0 && (
                    <div className="space-y-2">
                      {formData.lessons.map((lesson, index) => (
                        <div
                          key={lesson._id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-bold flex items-center justify-center text-gray-700">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">{lesson.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs md:max-w-md">
                                {lesson.youtubeUrl} • {lesson.durationMinutes} mins
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveLesson(index, -1)}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLesson(index, 1)}
                              disabled={index === formData.lessons.length - 1}
                              className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(index)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add lesson sub-box */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3">
                    <h5 className="text-xs font-semibold text-gray-700">
                      {t('teacherCourses.form.addLessonTitle') || 'Add a Lesson'}
                    </h5>

                    {lessonError && (
                      <p className="text-xs text-red-600 font-medium">{lessonError}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          placeholder={t('teacherCourses.form.lessonTitlePlaceholder') || 'Lesson Title'}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={lessonForm.youtubeUrl}
                          onChange={(e) =>
                            setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={lessonForm.description}
                          onChange={(e) =>
                            setLessonForm({ ...lessonForm, description: e.target.value })
                          }
                          placeholder={t('teacherCourses.form.lessonDescPlaceholder') || 'Optional notes/summary'}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={lessonForm.durationMinutes}
                          onChange={(e) =>
                            setLessonForm({ ...lessonForm, durationMinutes: e.target.value })
                          }
                          placeholder="Duration (mins)"
                          className="w-28 px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddLesson}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors"
                        >
                          {t('teacherCourses.form.addLessonBtn') || 'Add Lesson'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course PDF Materials Section */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>{t('teacherCourses.materials.title') || 'Course PDF Materials'}</span>
                    </h4>
                  </div>

                  {editingCourse && editingCourse._id ? (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {t('teacherCourses.materials.manageMaterialsBtn', {
                            count: editingCourse.materials?.length || 0
                          }) || `Manage PDF Materials (${editingCourse.materials?.length || 0})`}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {t('teacherCourses.materials.subtitle') || 'Upload study guides, worksheets, and references (PDF only, max 10MB)'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          handleOpenMaterialsModal(editingCourse);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t('teacherCourses.materials.manageMaterialsAction') || 'Manage Materials'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-start gap-2.5 text-xs text-gray-600">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p>
                        {t('teacherCourses.materials.saveFirstNotice') ||
                          'Save the course first. You can then attach PDF worksheets, summaries, and other course materials.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Form submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {t('teacherCourses.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {editingCourse
                        ? t('teacherCourses.form.saveChanges') || 'Save Changes'
                        : t('teacherCourses.form.createCourse') || 'Create Course'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Course Materials Modal */}
        {materialsModalCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t('teacherCourses.materials.title') || 'Course PDF Materials'}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{materialsModalCourse.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMaterialsModalCourse(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status messages */}
              {materialError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{materialError}</span>
                </div>
              )}
              {materialSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{materialSuccess}</span>
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleUploadMaterial} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {t('teacherCourses.materials.uploadBtn') || 'Upload PDF'}
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.materials.titleLabel') || 'Material Title'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder={t('teacherCourses.materials.titlePlaceholder') || 'e.g. Chapter 1 Notes & Exercises'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('teacherCourses.materials.fileLabel') || 'Select PDF File'} (max 10MB) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setMaterialFile(file);
                        if (file && !materialTitle.trim()) {
                          // Suggest title based on filename minus extension
                          setMaterialTitle(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={materialUploading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {materialUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('teacherCourses.materials.uploading') || 'Uploading...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('teacherCourses.materials.uploadBtn') || 'Upload PDF'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Existing Materials List */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {t('teacherCourses.materials.title') || 'Course PDF Materials'} ({materialsModalCourse.materials?.length || 0})
                </h4>
                {(!materialsModalCourse.materials || materialsModalCourse.materials.length === 0) ? (
                  <p className="text-xs text-gray-500 py-3 text-center italic">
                    {t('teacherCourses.materials.empty') || 'No PDF materials attached yet.'}
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {materialsModalCourse.materials.map((m) => (
                      <div key={m._id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {m.originalFilename || 'document.pdf'} &bull; {formatFileSize(m.fileSize)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadMaterial(m._id, m.originalFilename)}
                            disabled={materialDownloadingId === m._id}
                            className="p-1.5 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                            title={t('teacherCourses.materials.downloadBtn') || 'Download'}
                          >
                            {materialDownloadingId === m._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(m._id)}
                            disabled={materialDeletingId === m._id}
                            className="p-1.5 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            title={t('teacherCourses.materials.deleteBtn') || 'Delete'}
                          >
                            {materialDeletingId === m._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMaterialsModalCourse(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  {t('teacherCourses.cancel') || 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
