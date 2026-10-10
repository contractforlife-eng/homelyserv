// backend/src/controllers/studentCourseController.js
// ============================================================
// STUDENT COURSE CONTROLLER (HomelyServ LMS Phase 1)
// ============================================================
// Public/student course discovery, playback protection, and
// free course enrollment.
// ============================================================
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';

/**
 * Helper to mask lessons for unauthorized users on paid courses.
 * If user is not authorized, strip youtubeUrl and youtubeVideoId,
 * and mark isLocked = true.
 */
const formatLessonsForConsumer = (lessons, isAuthorized) => {
  return lessons.map((lesson) => {
    const plain = lesson.toObject ? lesson.toObject() : { ...lesson };
    if (isAuthorized) {
      return {
        ...plain,
        isLocked: false
      };
    }
    // Mask sensitive video identifiers
    return {
      _id: plain._id,
      title: plain.title,
      description: plain.description,
      order: plain.order,
      durationMinutes: plain.durationMinutes,
      isLocked: true,
      youtubeUrl: null,
      youtubeVideoId: null
    };
  });
};

/**
 * Helper to format materials for consumer.
 * If authorized, expose title, originalFilename, fileSize, createdAt, _id.
 * Never expose raw publicId.
 * If unauthorized on paid course, strip details or return empty list.
 */
const formatMaterialsForConsumer = (materials, isAuthorized) => {
  if (!Array.isArray(materials)) return [];
  return materials.map((m) => {
    const plain = m.toObject ? m.toObject() : { ...m };
    return {
      _id: String(plain._id),
      title: plain.title || 'Course Material',
      fileSize: plain.fileSize || 0,
      originalFilename: plain.originalFilename || '',
      createdAt: plain.createdAt,
      isLocked: !isAuthorized
    };
  });
};

/**
 * GET /api/courses
 * Discover published recorded courses (open to authenticated students & public).
 * Query params: subject, gradeLevel, search, isPaid.
 */
export const getPublishedCourses = async (req, res) => {
  try {
    const { subject, gradeLevel, search, isPaid } = req.query;

    const filter = { isPublished: true };

    if (subject) {
      filter.subject = subject;
    }

    if (gradeLevel) {
      filter.gradeLevel = gradeLevel;
    }

    if (isPaid !== undefined && isPaid !== '') {
      filter.isPaid = isPaid === 'true';
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { gradeSubtitle: { $regex: term, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('teacherId', 'fullName profileImage isVerified')
      .sort({ createdAt: -1 });

    // Format summary list (never expose raw video URLs in catalog list)
    const formatted = courses.map((course) => {
      const doc = course.toObject ? course.toObject() : { ...course };
      const totalLessons = doc.lessons ? doc.lessons.length : 0;
      const totalDuration = doc.lessons
        ? doc.lessons.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0)
        : 0;

      delete doc.lessons;
      return {
        ...doc,
        totalLessons,
        totalDurationMinutes: totalDuration
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      courses: formatted
    });
  } catch (error) {
    console.error('Error fetching published courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

/**
 * GET /api/courses/:id
 * Retrieve a published course with curriculum details.
 * Enforces playback masking if course is paid and user is not enrolled.
 */
export const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId; // May be null if unauthenticated or student/teacher

    const course = await Course.findById(id).populate(
      'teacherId',
      'fullName profileImage isVerified'
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Authors can view their own unpublished courses
    const isAuthor =
      currentUserId && String(course.teacherId?._id || course.teacherId) === String(currentUserId);

    if (!course.isPublished && !isAuthor) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not published'
      });
    }

    // Check enrollment
    let isEnrolled = false;
    let enrollment = null;
    if (currentUserId) {
      enrollment = await CourseEnrollment.findOne({
        courseId: id,
        studentUserId: currentUserId,
        status: 'ACTIVE'
      });
      if (enrollment) {
        isEnrolled = true;
      }
    }

    // Access authorization:
    // Authorized to watch all videos if:
    // 1. User is the teacher author
    // 2. User has an active enrollment (via free enrollment for free courses, or verified payment fulfillment for paid courses)
    const isAuthorized = isAuthor || isEnrolled;

    const doc = course.toObject ? course.toObject() : { ...course };
    const safeLessons = formatLessonsForConsumer(doc.lessons || [], isAuthorized);
    const safeMaterials = formatMaterialsForConsumer(doc.materials || [], isAuthorized);

    return res.json({
      success: true,
      course: {
        ...doc,
        lessons: safeLessons,
        materials: safeMaterials
      },
      isEnrolled,
      isAuthorized,
      enrollmentId: enrollment?._id || null
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
      error: error.message
    });
  }
};

/**
 * POST /api/students/courses/:id/enroll
 * Enroll in a free course.
 * Rejects paid courses until Phase 2 payment flow is active.
 * Compound unique index on CourseEnrollment handles concurrent duplicate prevention.
 */
export const enrollInFreeCourse = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course || !course.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not published'
      });
    }

    if (course.isPaid) {
      return res.status(403).json({
        success: false,
        message:
          'This is a paid course. Direct free enrollment is not permitted. Checkout will be available in Phase 2.'
      });
    }

    // Check if already enrolled
    const existing = await CourseEnrollment.findOne({
      courseId: id,
      studentUserId
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.json({
          success: true,
          message: 'Already enrolled in this course',
          enrollment: existing
        });
      }
      existing.status = 'ACTIVE';
      existing.enrolledAt = new Date();
      await existing.save();
      return res.json({
        success: true,
        message: 'Re-enrolled in course successfully',
        enrollment: existing
      });
    }

    const enrollment = new CourseEnrollment({
      courseId: id,
      studentUserId,
      status: 'ACTIVE'
    });

    await enrollment.save();

    return res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: 'Already enrolled in this course'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
};

/**
 * GET /api/students/my-courses
 * List all courses the authenticated student is currently enrolled in.
 */
export const getMyEnrolledCourses = async (req, res) => {
  try {
    const studentUserId = req.userId;

    const enrollments = await CourseEnrollment.find({
      studentUserId,
      status: 'ACTIVE'
    }).populate({
      path: 'courseId',
      populate: {
        path: 'teacherId',
        select: 'fullName profileImage isVerified'
      }
    });

    const courses = enrollments
      .filter((e) => e.courseId && e.courseId.isPublished)
      .map((e) => {
        const c = e.courseId.toObject ? e.courseId.toObject() : { ...e.courseId };
        const totalLessons = c.lessons ? c.lessons.length : 0;
        delete c.lessons;
        return {
          ...c,
          enrollmentId: e._id,
          enrolledAt: e.enrolledAt,
          totalLessons
        };
      });

    return res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses',
      error: error.message
    });
  }
};

/**
 * GET /api/students/courses/:id/materials/:materialId/download
 * Generates an authorized, time-limited signed download URL for an enrolled student.
 * Or for the teacher author if calling.
 */
export const getCourseMaterialDownloadUrl = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id, materialId } = req.params;

    const course = await Course.findById(id);
    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, message: 'Course not found or not published' });
    }

    const material = course.materials?.find((m) => String(m._id) === String(materialId));
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    const isAuthor = String(course.teacherId) === String(studentUserId);
    let isEnrolled = false;

    if (!isAuthor) {
      const enrollment = await CourseEnrollment.findOne({
        courseId: id,
        studentUserId,
        status: 'ACTIVE'
      });
      if (enrollment) {
        isEnrolled = true;
      }
    }

    if (!isAuthor && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: course.isPaid
          ? 'Enrollment or payment required to download course materials'
          : 'Enrollment required to download course materials'
      });
    }

    const { generateSignedMaterialUrl } = await import('../utils/courseMaterialUpload.js');
    const downloadUrl = generateSignedMaterialUrl(material.publicId, 3600); // 1 hour TTL

    if (!downloadUrl) {
      return res.status(500).json({ success: false, message: 'Failed to generate download link' });
    }

    return res.json({
      success: true,
      downloadUrl,
      material: {
        id: String(material._id),
        title: material.title,
        originalFilename: material.originalFilename,
        fileSize: material.fileSize
      }
    });
  } catch (error) {
    console.error('Error generating course material download URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate download URL',
      error: error.message
    });
  }
};
