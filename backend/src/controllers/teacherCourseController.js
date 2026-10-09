// backend/src/controllers/teacherCourseController.js
// ============================================================
// TEACHER COURSE CONTROLLER (HomelyServ LMS Phase 1)
// ============================================================
// Strictly scoped to req.userId (authenticated teacher).
// Teachers can create and manage their own courses without Premium.
// ============================================================
import Course from '../models/Course.js';
import User from '../models/User.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';
import { uploadFromBuffer } from '../utils/cloudinary.js';
import {
  CANONICAL_TEACHER_SUBJECTS,
  CANONICAL_TEACHING_LEVELS
} from '../constants/teacherTaxonomy.js';

/**
 * GET /api/teachers/courses
 * List all courses authored by the authenticated teacher.
 */
export const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const courses = await Course.find({ teacherId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/courses/:id
 * Retrieve a single course owned by the authenticated teacher.
 */
export const getTeacherCourseById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, teacherId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    return res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message
    });
  }
};

/**
 * Helper to validate and sanitize lesson items
 */
const sanitizeLessons = (lessons) => {
  if (!Array.isArray(lessons)) return { valid: true, lessons: [] };

  const sanitized = [];
  for (let i = 0; i < lessons.length; i++) {
    const item = lessons[i];
    const title = String(item.title || '').trim();
    if (!title) {
      return { valid: false, error: `Lesson #${i + 1} requires a title` };
    }

    const youtubeUrl = String(item.youtubeUrl || '').trim();
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return {
        valid: false,
        error: `Lesson #${i + 1} has an invalid YouTube URL: "${youtubeUrl}"`
      };
    }

    sanitized.push({
      _id: item._id,
      title,
      description: String(item.description || '').trim(),
      youtubeUrl,
      youtubeVideoId: videoId,
      order: Number(item.order) || i + 1,
      durationMinutes: Math.max(0, Number(item.durationMinutes) || 0)
    });
  }

  // Sort by order ascending
  sanitized.sort((a, b) => a.order - b.order);
  return { valid: true, lessons: sanitized };
};

/**
 * POST /api/teachers/courses
 * Create a new recorded course.
 */
export const createTeacherCourse = async (req, res) => {
  try {
    const teacherId = req.userId;
    const {
      title,
      description,
      subject,
      gradeLevel,
      gradeSubtitle,
      thumbnailUrl,
      isPaid,
      price,
      currency,
      lessons
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }

    if (!CANONICAL_TEACHER_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course subject. Must be a canonical teacher subject.'
      });
    }

    if (!CANONICAL_TEACHING_LEVELS.includes(gradeLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade level. Must be a canonical teaching level.'
      });
    }

    const lessonResult = sanitizeLessons(lessons || []);
    if (!lessonResult.valid) {
      return res.status(400).json({
        success: false,
        message: lessonResult.error
      });
    }

    const numericPrice = Math.max(0, Number(price) || 0);
    const paidBool = Boolean(isPaid);

    const newCourse = new Course({
      teacherId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      subject,
      gradeLevel,
      gradeSubtitle: String(gradeSubtitle || '').trim(),
      thumbnailUrl: String(thumbnailUrl || '').trim(),
      isPaid: paidBool,
      price: paidBool ? numericPrice : 0,
      currency: String(currency || 'EGP').trim().toUpperCase(),
      isPublished: false,
      lessons: lessonResult.lessons
    });

    await newCourse.save();

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/courses/:id
 * Update an existing course owned by the teacher.
 */
export const updateTeacherCourse = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, teacherId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const {
      title,
      description,
      subject,
      gradeLevel,
      gradeSubtitle,
      thumbnailUrl,
      isPaid,
      price,
      currency,
      lessons,
      isPublished
    } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Course title cannot be empty'
        });
      }
      course.title = String(title).trim();
    }

    if (description !== undefined) {
      course.description = String(description).trim();
    }

    if (subject !== undefined) {
      if (!CANONICAL_TEACHER_SUBJECTS.includes(subject)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course subject'
        });
      }
      course.subject = subject;
    }

    if (gradeLevel !== undefined) {
      if (!CANONICAL_TEACHING_LEVELS.includes(gradeLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grade level'
        });
      }
      course.gradeLevel = gradeLevel;
    }

    if (gradeSubtitle !== undefined) {
      course.gradeSubtitle = String(gradeSubtitle).trim();
    }

    if (thumbnailUrl !== undefined) {
      course.thumbnailUrl = String(thumbnailUrl).trim();
    }

    if (isPaid !== undefined) {
      course.isPaid = Boolean(isPaid);
    }

    if (price !== undefined) {
      course.price = course.isPaid ? Math.max(0, Number(price) || 0) : 0;
    }

    if (currency !== undefined) {
      course.currency = String(currency).trim().toUpperCase() || 'EGP';
    }

    if (isPublished !== undefined) {
      course.isPublished = Boolean(isPublished);
    }

    if (lessons !== undefined) {
      const lessonResult = sanitizeLessons(lessons);
      if (!lessonResult.valid) {
        return res.status(400).json({
          success: false,
          message: lessonResult.error
        });
      }
      course.lessons = lessonResult.lessons;
    }

    await course.save();

    return res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
};

/**
 * PATCH /api/teachers/courses/:id/publish
 * Toggle publish status of a course.
 */
export const toggleCoursePublish = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, teacherId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const { isPublished } = req.body;
    course.isPublished =
      typeof isPublished === 'boolean' ? isPublished : !course.isPublished;

    await course.save();

    return res.json({
      success: true,
      message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished: course.isPublished,
      course
    });
  } catch (error) {
    console.error('Error toggling course publish:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update publication status',
      error: error.message
    });
  }
};

/**
 * DELETE /api/teachers/courses/:id
 * Delete a course authored by the teacher.
 */
export const deleteTeacherCourse = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    const result = await Course.findOneAndDelete({ _id: id, teacherId });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    return res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/courses/upload-thumbnail
 * Upload a course thumbnail image to Cloudinary.
 */
export const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const uploadResult = await uploadFromBuffer(req.file.buffer, {
      folder: 'homelyserv/courses',
      transformation: [{ width: 1280, height: 720, crop: 'limit' }]
    });

    return res.json({
      success: true,
      thumbnailUrl: uploadResult.secure_url || uploadResult.url
    });
  } catch (error) {
    console.error('Error uploading course thumbnail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload course thumbnail',
      error: error.message
    });
  }
};
