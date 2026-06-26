import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Building,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Shield,
  Award,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [userType, setUserType] = useState('worker'); // 'worker' or 'employer'
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    city: '',
    language: 'en',
    
    // Worker specific
    category: '',
    experienceYears: 0,
    expectedSalary: '',
    availability: 'available',
    workType: 'full-time',
    bioAr: '',
    bioEn: '',
    skills: [],
    profilePhoto: null,
    
    // Employer specific
    companyName: '',
    companyType: 'individual',
    companySize: '1-10',
    budgetRange: '',
    preferredCategories: []
  });

  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({
    employerName: '',
    role: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Categories
  const categories = [
    { id: 'nanny', label: { en: 'Nanny', ar: 'مربية أطفال' } },
    { id: 'baby-sitter', label: { en: 'Baby-Sitter', ar: 'جليسة أطفال' } },
    { id: 'elderly-caregiver', label: { en: 'Elderly Caregiver', ar: 'مقدم رعاية مسنين' } },
    { id: 'driver', label: { en: 'Driver', ar: 'سائق' } },
    { id: 'cook', label: { en: 'Cook', ar: 'طباخ' } },
    { id: 'house-manager', label: { en: 'House Manager', ar: 'مدير منزل' } },
    { id: 'gardener', label: { en: 'Gardener', ar: 'بستاني' } },
    { id: 'nurse', label: { en: 'Nurse', ar: 'ممرض' } }
  ];

  const availabilityOptions = [
    { id: 'available', label: { en: 'Available', ar: 'متاح' } },
    { id: 'part-time', label: { en: 'Part-Time', ar: 'دوام جزئي' } },
    { id: 'full-time', label: { en: 'Full-Time', ar: 'دوام كامل' } },
    { id: 'not-available', label: { en: 'Not Available', ar: 'غير متاح' } }
  ];

  const workTypeOptions = [
    { id: 'full-time', label: { en: 'Full-Time', ar: 'دوام كامل' } },
    { id: 'part-time', label: { en: 'Part-Time', ar: 'دوام جزئي' } },
    { id: 'contract', label: { en: 'Contract', ar: 'عقد' } },
    { id: 'temporary', label: { en: 'Temporary', ar: 'مؤقت' } }
  ];

  const companyTypes = [
    { id: 'individual', label: { en: 'Individual', ar: 'فرد' } },
    { id: 'family', label: { en: 'Family', ar: 'عائلة' } },
    { id: 'company', label: { en: 'Company', ar: 'شركة' } }
  ];

  const companySizes = [
    { id: '1-10', label: '1-10' },
    { id: '11-50', label: '11-50' },
    { id: '51-200', label: '51-200' },
    { id: '200+', label: '200+' }
  ];

  // Translations
  const translations = {
    en: {
      title: 'Create Account',
      subtitle: 'Join HomelyServ to find or offer home services',
      userType: {
        worker: 'Job Seeker',
        employer: 'Employer',
        workerDesc: 'Find job opportunities',
        employerDesc: 'Hire professionals'
      },
      steps: {
        personal: 'Personal Info',
        account: 'Account Details',
        worker: 'Worker Profile',
        employer: 'Employer Profile',
        documents: 'Documents',
        review: 'Review'
      },
      personal: {
        title: 'Personal Information',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your full name',
        email: 'Email Address',
        emailPlaceholder: 'you@example.com',
        phone: 'Phone Number',
        phonePlaceholder: 'Enter your phone number',
        city: 'City',
        cityPlaceholder: 'Enter your city',
        password: 'Password',
        passwordPlaceholder: 'Create a password (min 6 characters)',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Confirm your password'
      },
      worker: {
        title: 'Worker Profile',
        category: 'Category',
        categoryPlaceholder: 'Select your category',
        experience: 'Years of Experience',
        salary: 'Expected Salary (EGP/month)',
        salaryPlaceholder: 'Enter expected salary',
        availability: 'Availability',
        workType: 'Work Type',
        bio: 'About You',
        bioPlaceholder: 'Tell employers about yourself, your skills, and experience...',
        skills: 'Skills',
        skillsPlaceholder: 'Enter a skill and press Enter',
        addSkill: 'Add Skill',
        noSkills: 'No skills added yet',
        experiences: 'Experience',
        addExperience: 'Add Experience',
        noExperiences: 'No experience added yet',
        employerName: 'Employer Name',
        role: 'Role/Position',
        startDate: 'Start Date',
        endDate: 'End Date',
        currentWork: 'Current Work',
        description: 'Description',
        descriptionPlaceholder: 'Describe your responsibilities and achievements...'
      },
      employer: {
        title: 'Employer Profile',
        companyName: 'Company/Organization Name',
        companyNamePlaceholder: 'Enter company name',
        companyType: 'Type',
        companySize: 'Company Size',
        budgetRange: 'Budget Range (EGP/month)',
        budgetRangePlaceholder: 'Enter your budget range',
        preferredCategories: 'Preferred Categories',
        categoryPlaceholder: 'Select preferred categories'
      },
      documents: {
        title: 'Documents & Verification',
        uploadDocs: 'Upload Documents',
        uploadDesc: 'Upload your identification and qualification documents',
        dragDrop: 'Drag & drop or click to upload',
        supportedFormats: 'Supported formats: JPG, PNG, PDF (Max 5MB each)',
        documentType: 'Document Type',
        documentTypePlaceholder: 'Select document type',
        idCard: 'ID Card',
        passport: 'Passport',
        license: 'Professional License',
        certificate: 'Certificate',
        other: 'Other',
        uploadButton: 'Upload Document',
        noDocuments: 'No documents uploaded yet',
        verificationNote: 'Your documents will be verified by our team within 24-48 hours'
      },
      review: {
        title: 'Review & Submit',
        personalInfo: 'Personal Information',
        accountInfo: 'Account Information',
        profileInfo: 'Profile Information',
        documentsInfo: 'Documents',
        verifyInfo: 'Please review all information before submitting',
        terms: 'I agree to the Terms of Service and Privacy Policy',
        submit: 'Create Account',
        submitting: 'Creating Account...'
      },
      errors: {
        fullName: 'Full name is required',
        email: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        phone: 'Phone number is required',
        city: 'City is required',
        password: 'Password is required',
        passwordMin: 'Password must be at least 6 characters',
        passwordMatch: 'Passwords do not match',
        category: 'Please select a category',
        salary: 'Expected salary is required',
        salaryMin: 'Salary must be greater than 0',
        companyName: 'Company name is required',
        skills: 'Please add at least one skill',
        experience: 'Please add at least one experience',
        documents: 'Please upload at least one document',
        terms: 'Please accept the Terms of Service',
        fileSize: 'File size must be less than 5MB',
        fileType: 'Please upload a valid file'
      },
      success: {
        title: 'Registration Complete!',
        message: 'Your account has been created successfully.',
        worker: 'Your worker profile is now live. Employers can find you!',
        employer: 'You can now start searching for the perfect worker.',
        redirecting: 'Redirecting to dashboard...',
        verifyEmail: 'Please check your email to verify your account.'
      },
      back: 'Back',
      next: 'Next',
      skip: 'Skip for now',
      languageToggle: 'العربية'
    },
    ar: {
      title: 'إنشاء حساب',
      subtitle: 'انضم إلى HomelyServ للعثور على أو تقديم خدمات منزلية',
      userType: {
        worker: 'باحث عن عمل',
        employer: 'صاحب عمل',
        workerDesc: 'ابحث عن فرص عمل',
        employerDesc: 'وظف محترفين'
      },
      steps: {
        personal: 'معلومات شخصية',
        account: 'تفاصيل الحساب',
        worker: 'ملف العامل',
        employer: 'ملف صاحب العمل',
        documents: 'المستندات',
        review: 'مراجعة'
      },
      personal: {
        title: 'المعلومات الشخصية',
        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'أدخل اسمك الكامل',
        email: 'البريد الإلكتروني',
        emailPlaceholder: 'example@you.com',
        phone: 'رقم الهاتف',
        phonePlaceholder: 'أدخل رقم هاتفك',
        city: 'المدينة',
        cityPlaceholder: 'أدخل مدينتك',
        password: 'كلمة المرور',
        passwordPlaceholder: 'أنشئ كلمة مرور (6 أحرف على الأقل)',
        confirmPassword: 'تأكيد كلمة المرور',
        confirmPasswordPlaceholder: 'تأكيد كلمة المرور'
      },
      worker: {
        title: 'ملف العامل',
        category: 'الفئة',
        categoryPlaceholder: 'اختر فئتك',
        experience: 'سنوات الخبرة',
        salary: 'الراتب المتوقع (جنيه/شهر)',
        salaryPlaceholder: 'أدخل الراتب المتوقع',
        availability: 'التوفر',
        workType: 'نوع العمل',
        bio: 'نبذة عنك',
        bioPlaceholder: 'أخبر أصحاب العمل عن نفسك، مهاراتك وخبراتك...',
        skills: 'المهارات',
        skillsPlaceholder: 'أدخل مهارة واضغط Enter',
        addSkill: 'إضافة مهارة',
        noSkills: 'لم تتم إضافة مهارات بعد',
        experiences: 'الخبرات',
        addExperience: 'إضافة خبرة',
        noExperiences: 'لم تتم إضافة خبرات بعد',
        employerName: 'اسم صاحب العمل',
        role: 'الوظيفة/المسمى',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        currentWork: 'عمل حالي',
        description: 'الوصف',
        descriptionPlaceholder: 'صف مسؤولياتك وإنجازاتك...'
      },
      employer: {
        title: 'ملف صاحب العمل',
        companyName: 'اسم الشركة/المؤسسة',
        companyNamePlaceholder: 'أدخل اسم الشركة',
        companyType: 'النوع',
        companySize: 'حجم الشركة',
        budgetRange: 'نطاق الميزانية (جنيه/شهر)',
        budgetRangePlaceholder: 'أدخل نطاق الميزانية',
        preferredCategories: 'الفئات المفضلة',
        categoryPlaceholder: 'اختر الفئات المفضلة'
      },
      documents: {
        title: 'المستندات والتحقق',
        uploadDocs: 'تحميل المستندات',
        uploadDesc: 'قم بتحميل مستندات الهوية والمؤهلات الخاصة بك',
        dragDrop: 'اسحب وأفلت أو انقر للتحميل',
        supportedFormats: 'الصيغ المدعومة: JPG, PNG, PDF (حد أقصى 5 ميجابايت لكل ملف)',
        documentType: 'نوع المستند',
        documentTypePlaceholder: 'اختر نوع المستند',
        idCard: 'بطاقة الهوية',
        passport: 'جواز السفر',
        license: 'رخصة مهنية',
        certificate: 'شهادة',
        other: 'أخرى',
        uploadButton: 'تحميل مستند',
        noDocuments: 'لم يتم تحميل مستندات بعد',
        verificationNote: 'سيتم التحقق من مستنداتك من قبل فريقنا خلال ٢٤-٤٨ ساعة'
      },
      review: {
        title: 'مراجعة وتقديم',
        personalInfo: 'المعلومات الشخصية',
        accountInfo: 'معلومات الحساب',
        profileInfo: 'معلومات الملف الشخصي',
        documentsInfo: 'المستندات',
        verifyInfo: 'يرجى مراجعة جميع المعلومات قبل التقديم',
        terms: 'أوافق على شروط الخدمة وسياسة الخصوصية',
        submit: 'إنشاء حساب',
        submitting: 'جاري إنشاء الحساب...'
      },
      errors: {
        fullName: 'الاسم الكامل مطلوب',
        email: 'البريد الإلكتروني مطلوب',
        emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح',
        phone: 'رقم الهاتف مطلوب',
        city: 'المدينة مطلوبة',
        password: 'كلمة المرور مطلوبة',
        passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        passwordMatch: 'كلمات المرور غير متطابقة',
        category: 'يرجى اختيار فئة',
        salary: 'الراتب المتوقع مطلوب',
        salaryMin: 'الراتب يجب أن يكون أكبر من 0',
        companyName: 'اسم الشركة مطلوب',
        skills: 'يرجى إضافة مهارة واحدة على الأقل',
        experience: 'يرجى إضافة خبرة واحدة على الأقل',
        documents: 'يرجى تحميل مستند واحد على الأقل',
        terms: 'يرجى الموافقة على شروط الخدمة',
        fileSize: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت',
        fileType: 'يرجى تحميل ملف صحيح'
      },
      success: {
        title: 'تم التسجيل بنجاح!',
        message: 'تم إنشاء حسابك بنجاح.',
        worker: 'ملفك الشخصي كعامل متاح الآن. يمكن لأصحاب العمل العثور عليك!',
        employer: 'يمكنك الآن بدء البحث عن العامل المثالي.',
        redirecting: 'جاري التحويل إلى لوحة التحكم...',
        verifyEmail: 'يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.'
      },
      back: 'السابق',
      next: 'التالي',
      skip: 'تخطي الآن',
      languageToggle: 'English'
    }
  };

  const t = translations[language];

  // Check language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle skill addition
  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setSkillInput('');
    }
  };

  // Handle skill removal
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle experience add/edit
  const handleExperienceSubmit = (e) => {
    e.preventDefault();
    if (!currentExperience.employerName || !currentExperience.role || !currentExperience.startDate) {
      return;
    }

    if (editingExperienceIndex !== null) {
      // Edit existing experience
      const updatedExperiences = [...experiences];
      updatedExperiences[editingExperienceIndex] = currentExperience;
      setExperiences(updatedExperiences);
      setEditingExperienceIndex(null);
    } else {
      // Add new experience
      setExperiences([...experiences, currentExperience]);
    }

    setCurrentExperience({
      employerName: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setShowExperienceForm(false);
  };

  // Handle experience edit
  const handleEditExperience = (index) => {
    setCurrentExperience(experiences[index]);
    setEditingExperienceIndex(index);
    setShowExperienceForm(true);
  };

  // Handle experience removal
  const handleRemoveExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Handle document upload
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, documents: t.errors.fileSize }));
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, documents: t.errors.fileType }));
        return;
      }
      
      setUploadedDocs(prev => [...prev, {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        docType: 'other'
      }]);
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  };

  // Handle document removal
  const handleRemoveDocument = (index) => {
    setUploadedDocs(uploadedDocs.filter((_, i) => i !== index));
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = t.errors.fullName;
      if (!formData.email) newErrors.email = t.errors.email;
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t.errors.emailInvalid;
      if (!formData.phone) newErrors.phone = t.errors.phone;
      if (!formData.city) newErrors.city = t.errors.city;
      if (!formData.password) newErrors.password = t.errors.password;
      else if (formData.password.length < 6) newErrors.password = t.errors.passwordMin;
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t.errors.passwordMatch;
      }
    }

    if (step === 3 && userType === 'worker') {
      if (!formData.category) newErrors.category = t.errors.category;
      if (!formData.expectedSalary) newErrors.expectedSalary = t.errors.salary;
      else if (parseFloat(formData.expectedSalary) <= 0) newErrors.expectedSalary = t.errors.salaryMin;
      if (formData.skills.length === 0) newErrors.skills = t.errors.skills;
      if (experiences.length === 0) newErrors.experiences = t.errors.experience;
    }

    if (step === 3 && userType === 'employer') {
      if (!formData.companyName) newErrors.companyName = t.errors.companyName;
    }

    if (step === 4) {
      if (uploadedDocs.length === 0) newErrors.documents = t.errors.documents;
    }

    if (step === 5) {
      if (!termsAccepted) newErrors.terms = t.errors.terms;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      // In production, this would be an API call
      // const formDataToSend = new FormData();
      // Object.keys(formData).forEach(key => {
      //   if (key !== 'profilePhoto' && key !== 'confirmPassword') {
      //     formDataToSend.append(key, formData[key]);
      //   }
      // });
      // experiences.forEach((exp, index) => {
      //   Object.keys(exp).forEach(key => {
      //     formDataToSend.append(`experiences[${index}][${key}]`, exp[key]);
      //   });
      // });
      // uploadedDocs.forEach((doc, index) => {
      //   formDataToSend.append(`documents[${index}]`, doc.file);
      // });
      // formDataToSend.append('userType', userType);
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   body: formDataToSend
      // });
      // const data = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setRegistrationSuccess(true);
      setLoading(false);

      // Store user info in localStorage (for demo)
      localStorage.setItem('homelyserv_user', JSON.stringify({
        id: 'user_' + Date.now(),
        email: formData.email,
        fullName: formData.fullName,
        role: userType,
        registeredAt: new Date().toISOString()
      }));

      // Redirect after success
      setTimeout(() => {
        navigate(userType === 'worker' ? '/dashboard' : '/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
      setLoading(false);
    }
  };

  const isRTL = language === 'ar';

  // Success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.success.title}</h2>
          <p className="text-gray-600 mb-4">{t.success.message}</p>
          <p className="text-sm text-gray-500">
            {userType === 'worker' ? t.success.worker : t.success.employer}
          </p>
          <p className="text-sm text-gray-400 mt-4">{t.success.verifyEmail}</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">{t.success.redirecting}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get step label
  const getStepLabel = () => {
    const steps = [
      t.steps.personal,
      t.steps.account,
      userType === 'worker' ? t.steps.worker : t.steps.employer,
      t.steps.documents,
      t.steps.review
    ];
    return steps[step - 1] || '';
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderPersonalStep();
      case 2:
        return renderAccountStep();
      case 3:
        return userType === 'worker' ? renderWorkerStep() : renderEmployerStep();
      case 4:
        return renderDocumentsStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Personal Info Step
  const renderPersonalStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.personal.title}</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.fullName}
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.fullName ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
          placeholder={t.personal.fullNamePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.email}
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.email ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
          placeholder={t.personal.emailPlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.phone}
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.phone ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
          placeholder={t.personal.phonePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.city}
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.city ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
          placeholder={t.personal.cityPlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-500">{errors.city}</p>
        )}
      </div>
    </div>
  );

  // Account Step
  const renderAccountStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.steps.account}</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.password}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.password ? 'border-red-500' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
            placeholder={t.personal.passwordPlaceholder}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.personal.confirmPassword}
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
            placeholder={t.personal.confirmPasswordPlaceholder}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <Shield size={16} className="inline mr-1" />
          Your password should be at least 6 characters and include a mix of letters and numbers.
        </p>
      </div>
    </div>
  );

  // Worker Step
  const renderWorkerStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.worker.title}</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.worker.category}
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.category ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
        >
          <option value="">{t.worker.categoryPlaceholder}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.label[language]}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.worker.experience}
          </label>
          <input
            type="number"
            name="experienceYears"
            value={formData.experienceYears}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            min="0"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.worker.salary}
          </label>
          <input
            type="number"
            name="expectedSalary"
            value={formData.expectedSalary}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.expectedSalary ? 'border-red-500' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
            placeholder={t.worker.salaryPlaceholder}
            min="0"
          />
          {errors.expectedSalary && (
            <p className="mt-1 text-sm text-red-500">{errors.expectedSalary}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.worker.availability}
          </label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {availabilityOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label[language]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.worker.workType}
          </label>
          <select
            name="workType"
            value={formData.workType}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {workTypeOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label[language]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.worker.bio}
        </label>
        <textarea
          name="bioEn"
          value={formData.bioEn}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          placeholder={t.worker.bioPlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.worker.skills}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={t.worker.skillsPlaceholder}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t.worker.addSkill}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {formData.skills.length === 0 && (
            <p className="text-sm text-gray-400">{t.worker.noSkills}</p>
          )}
        </div>
        {errors.skills && (
          <p className="mt-1 text-sm text-red-500">{errors.skills}</p>
        )}
      </div>

      {/* Experience */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t.worker.experiences}
          </label>
          <button
            type="button"
            onClick={() => {
              setCurrentExperience({
                employerName: '',
                role: '',
                startDate: '',
                endDate: '',
                description: ''
              });
              setEditingExperienceIndex(null);
              setShowExperienceForm(!showExperienceForm);
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {showExperienceForm ? t.back : t.worker.addExperience}
          </button>
        </div>

        {showExperienceForm && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.worker.employerName}
                </label>
                <input
                  type="text"
                  value={currentExperience.employerName}
                  onChange={(e) => setCurrentExperience(prev => ({ ...prev, employerName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.worker.role}
                </label>
                <input
                  type="text"
                  value={currentExperience.role}
                  onChange={(e) => setCurrentExperience(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.worker.startDate}
                  </label>
                  <input
                    type="date"
                    value={currentExperience.startDate}
                    onChange={(e) => setCurrentExperience(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.worker.endDate}
                  </label>
                  <input
                    type="date"
                    value={currentExperience.endDate}
                    onChange={(e) => setCurrentExperience(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.worker.description}
                </label>
                <textarea
                  value={currentExperience.description}
                  onChange={(e) => setCurrentExperience(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder={t.worker.descriptionPlaceholder}
                />
              </div>
              <button
                type="button"
                onClick={handleExperienceSubmit}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingExperienceIndex !== null ? 'Update' : 'Add'} Experience
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {experiences.map((exp, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{exp.role}</p>
                  <p className="text-sm text-gray-600">{exp.employerName}</p>
                  <p className="text-xs text-gray-400">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-500 mt-1">{exp.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditExperience(index)}
                    className="p-1 text-blue-500 hover:text-blue-600"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(index)}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {experiences.length === 0 && !showExperienceForm && (
            <p className="text-sm text-gray-400">{t.worker.noExperiences}</p>
          )}
        </div>
        {errors.experiences && (
          <p className="mt-1 text-sm text-red-500">{errors.experiences}</p>
        )}
      </div>
    </div>
  );

  // Employer Step
  const renderEmployerStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.employer.title}</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.employer.companyName}
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.companyName ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-red-500`}
          placeholder={t.employer.companyNamePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        {errors.companyName && (
          <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.employer.companyType}
          </label>
          <select
            name="companyType"
            value={formData.companyType}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {companyTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label[language]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.employer.companySize}
          </label>
          <select
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {companySizes.map(size => (
              <option key={size.id} value={size.id}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.employer.budgetRange}
        </label>
        <input
          type="text"
          name="budgetRange"
          value={formData.budgetRange}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder={t.employer.budgetRangePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.employer.preferredCategories}
        </label>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preferredCategories.includes(cat.id)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...formData.preferredCategories, cat.id]
                    : formData.preferredCategories.filter(id => id !== cat.id);
                  setFormData(prev => ({ ...prev, preferredCategories: newCategories }));
                }}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{cat.label[language]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Documents Step
  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.documents.title}</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
        <Upload size={40} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{t.documents.uploadDesc}</p>
        <p className="text-xs text-gray-400 mt-1">{t.documents.supportedFormats}</p>
        <button
          type="button"
          onClick={() => document.getElementById('document-upload').click()}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          {t.documents.uploadButton}
        </button>
        <input
          id="document-upload"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleDocumentUpload}
          className="hidden"
          multiple
        />
      </div>

      {uploadedDocs.length > 0 && (
        <div className="space-y-2">
          {uploadedDocs.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                  <p className="text-xs text-gray-400">{(doc.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDocument(index)}
                className="p-1 text-red-500 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.documents && (
        <p className="text-sm text-red-500">{errors.documents}</p>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <Shield size={18} className="flex-shrink-0 mt-0.5" />
          <span>{t.documents.verificationNote}</span>
        </p>
      </div>
    </div>
  );

  // Review Step
  const renderReviewStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.review.title}</h2>
      
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
        <p className="text-sm text-yellow-800 flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{t.review.verifyInfo}</span>
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">{t.review.personalInfo}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">{t.personal.fullName}:</span>
            <span className="font-medium">{formData.fullName}</span>
            <span className="text-gray-500">{t.personal.email}:</span>
            <span className="font-medium">{formData.email}</span>
            <span className="text-gray-500">{t.personal.phone}:</span>
            <span className="font-medium">{formData.phone}</span>
            <span className="text-gray-500">{t.personal.city}:</span>
            <span className="font-medium">{formData.city}</span>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {userType === 'worker' ? t.review.profileInfo : t.review.profileInfo}
          </h3>
          {userType === 'worker' ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">{t.worker.category}:</span>
              <span className="font-medium">
                {categories.find(c => c.id === formData.category)?.label[language] || 'N/A'}
              </span>
              <span className="text-gray-500">{t.worker.experience}:</span>
              <span className="font-medium">{formData.experienceYears} years</span>
              <span className="text-gray-500">{t.worker.salary}:</span>
              <span className="font-medium">EGP {formData.expectedSalary}</span>
              <span className="text-gray-500">{t.worker.availability}:</span>
              <span className="font-medium">
                {availabilityOptions.find(a => a.id === formData.availability)?.label[language]}
              </span>
              <span className="text-gray-500">{t.worker.skills}:</span>
              <span className="font-medium">{formData.skills.join(', ') || 'None'}</span>
              <span className="text-gray-500">Experience:</span>
              <span className="font-medium">{experiences.length} entries</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">{t.employer.companyName}:</span>
              <span className="font-medium">{formData.companyName}</span>
              <span className="text-gray-500">{t.employer.companyType}:</span>
              <span className="font-medium">
                {companyTypes.find(c => c.id === formData.companyType)?.label[language]}
              </span>
              <span className="text-gray-500">{t.employer.companySize}:</span>
              <span className="font-medium">{formData.companySize}</span>
              <span className="text-gray-500">{t.employer.budgetRange}:</span>
              <span className="font-medium">{formData.budgetRange || 'Not specified'}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">{t.review.documentsInfo}</h3>
          <p className="text-sm">
            <span className="text-gray-500">Documents uploaded:</span>
            <span className="font-medium ml-2">{uploadedDocs.length} files</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
          />
          <span className="text-sm text-gray-600">{t.review.terms}</span>
        </label>
        {errors.terms && (
          <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm bg-white"
          >
            <Globe size={16} className="text-gray-600" />
            <span className="font-medium">{t.languageToggle}</span>
          </button>
        </div>

        {/* User Type Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('worker')}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  userType === 'worker'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Briefcase size={32} className={`mx-auto mb-3 ${
                  userType === 'worker' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-800">{t.userType.worker}</h3>
                <p className="text-sm text-gray-500">{t.userType.workerDesc}</p>
              </button>
              <button
                type="button"
                onClick={() => setUserType('employer')}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  userType === 'employer'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building size={32} className={`mx-auto mb-3 ${
                  userType === 'employer' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-800">{t.userType.employer}</h3>
                <p className="text-sm text-gray-500">{t.userType.employerDesc}</p>
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <button
                  type="button"
                  onClick={() => s < step && setStep(s)}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    s <= step ? 'text-red-600' : 'text-gray-300'
                  } ${s < step ? 'cursor-pointer hover:text-red-700' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {s < step ? <Check size={16} /> : s}
                  </div>
                  <span className="text-xs hidden md:inline">{getStepLabelForStep(s)}</span>
                </button>
                {s < 5 && (
                  <div className={`flex-1 h-0.5 ${
                    s < step ? 'bg-red-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center mt-3 text-sm text-gray-500">
            {getStepLabel()}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t.back}
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
              >
                {t.next}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t.review.submitting}
                  </>
                ) : (
                  t.review.submit
                )}
              </button>
            )}
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );

  // Helper function for step labels
  function getStepLabelForStep(stepNum) {
    const labels = [
      t.steps.personal,
      t.steps.account,
      userType === 'worker' ? t.steps.worker : t.steps.employer,
      t.steps.documents,
      t.steps.review
    ];
    return labels[stepNum - 1] || '';
  }
};

export default Register;