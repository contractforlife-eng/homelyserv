// backend/src/models/TeacherGroup.js
// ============================================================
// TEACHER GROUP / CLASS MODEL
//
// Represents a class or teaching group owned strictly by a Teacher.
// Groups organize students and store basic metadata (subject, grade,
// academic year, schedule days, display color).
//
// TENANCY:
// Every group belongs strictly to `teacherId: req.userId`.
// Teachers can never read, modify, or archive each other's groups.
// ============================================================
import mongoose from 'mongoose';

const teacherGroupSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    gradeLevel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    academicYear: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    // Schedule days metadata (e.g. ['Sunday', 'Tuesday'] or ['SUN', 'TUE'])
    scheduleDays: {
      type: [String],
      default: []
    },
    // Visual badge/accent color (hex or standard color key)
    color: {
      type: String,
      default: '#DC2626', // default red accent
      trim: true,
      maxlength: 30
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'teacher_groups'
  }
);

// Primary list query index: active groups for a teacher sorted by creation
teacherGroupSchema.index(
  { teacherId: 1, isActive: 1, createdAt: -1 },
  { name: 'teacher_group_active_list' }
);

// Name lookup within a teacher's groups
teacherGroupSchema.index(
  { teacherId: 1, name: 1 },
  { name: 'teacher_group_name_lookup' }
);

const TeacherGroup =
  mongoose.models.TeacherGroup ||
  mongoose.model('TeacherGroup', teacherGroupSchema);

export default TeacherGroup;
