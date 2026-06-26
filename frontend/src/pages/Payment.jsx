import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Wallet,
  Phone,
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  Upload,
  FileText,
  Eye,
  Download,
  CreditCard,
  Building,
  User,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  RefreshCw,
  Globe,
  ChevronDown,
  ChevronUp,
  Info,
  MessageCircle,
  Star,
  MapPin
} from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const { hireId } = useParams();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('instapay');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStep, setPaymentStep] = useState(1);
  const [copySuccess, setCopySuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [hireDetails, setHireDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Payment methods configuration
  const paymentMethods = {
    instapay: {
      id: 'instapay',
      label: {
        en: 'InstaPay',
        ar: 'إنستا باي'
      },
      icon: <Wallet size={24} />,
      description: {
        en: 'Pay instantly using InstaPay mobile app',
        ar: 'ادفع فوراً باستخدام تطبيق إنستا باي'
      },
      recipientNumber: '01009189851',
      processingTime: {
        en: 'Instant - 2 hours',
        ar: 'فوري - ساعتين'
      },
      steps: {
        en: [
          'Open your bank\'s mobile app',
          'Select InstaPay transfer',
          'Enter recipient number: 01009189851',
          'Enter the exact amount shown below',
          'Add reference code in the note field',
          'Upload screenshot as proof of payment'
        ],
        ar: [
          'افتح تطبيق البنك الخاص بك',
          'اختر تحويل إنستا باي',
          'أدخل رقم المستلم: 01009189851',
          'أدخل المبلغ المحدد كما هو موضح أدناه',
          'أضف رمز المرجع في حقل الملاحظات',
          'قم بتحميل لقطة شاشة كدليل على الدفع'
        ]
      }
    },
    vodafone: {
      id: 'vodafone',
      label: {
        en: 'Vodafone Cash',
        ar: 'فودافون كاش'
      },
      icon: <Phone size={24} />,
      description: {
        en: 'Pay using Vodafone Cash mobile wallet',
        ar: 'ادفع باستخدام محفظة فودافون كاش'
      },
      recipientNumber: '01009189851',
      processingTime: {
        en: '1-2 hours',
        ar: '١-٢ ساعة'
      },
      steps: {
        en: [
          'Dial *9# from your Vodafone number',
          'Select "Send Money"',
          'Enter recipient number: 01009189851',
          'Enter the exact amount shown below',
          'Add reference code in the note field',
          'Upload screenshot as proof of payment'
        ],
        ar: [
          'اطلب *9# من رقم فودافون الخاص بك',
          'اختر "إرسال أموال"',
          'أدخل رقم المستلم: 01009189851',
          'أدخل المبلغ المحدد كما هو موضح أدناه',
          'أضف رمز المرجع في حقل الملاحظات',
          'قم بتحميل لقطة شاشة كدليل على الدفع'
        ]
      }
    },
    bank: {
      id: 'bank',
      label: {
        en: 'Bank Transfer',
        ar: 'تحويل بنكي'
      },
      icon: <Building size={24} />,
      description: {
        en: 'Transfer via bank account (QNB)',
        ar: 'تحويل عبر الحساب البنكي (QNB)'
      },
      recipientNumber: '1002425938683',
      processingTime: {
        en: '24-48 hours',
        ar: '٢٤-٤٨ ساعة'
      },
      steps: {
        en: [
          'Login to your bank account',
          'Add new beneficiary with the details below',
          'Enter the exact amount shown below',
          'Add reference code in the note field',
          'Upload screenshot as proof of payment'
        ],
        ar: [
          'سجل الدخول إلى حسابك البنكي',
          'أضف مستفيد جديد بالتفاصيل أدناه',
          'أدخل المبلغ المحدد كما هو موضح أدناه',
          'أضف رمز المرجع في حقل الملاحظات',
          'قم بتحميل لقطة شاشة كدليل على الدفع'
        ]
      },
      bankDetails: {
        accountNumber: '1002425938683',
        iban: 'EG580037000908181002425938683',
        swift: 'QNBAEGCXXXX',
        bankName: 'QNB Alahli',
        branch: 'Cairo Main Branch'
      }
    }
  };

  // Translations
  const translations = {
    en: {
      title: 'Complete Payment',
      subtitle: 'Pay the commission to confirm your hire',
      backToHires: 'Back to Hires',
      hireDetails: 'Hire Details',
      worker: 'Worker',
      employer: 'Employer',
      position: 'Position',
      salary: 'Agreed Salary',
      commission: 'Commission (6.5%)',
      vat: 'VAT (14%)',
      totalDue: 'Total Due',
      referenceCode: 'Reference Code',
      paymentMethods: 'Payment Methods',
      selectMethod: 'Select your preferred payment method',
      chooseMethod: 'Choose Payment Method',
      howToPay: 'How to Pay',
      paymentSteps: 'Follow these steps to complete payment',
      paymentDetails: 'Payment Details',
      recipient: 'Recipient',
      amount: 'Amount',
      method: 'Method',
      reference: 'Reference Code',
      uploadProof: 'Upload Proof of Payment',
      uploadProofDesc: 'Upload a screenshot of the payment confirmation',
      dragDrop: 'Drag & drop or click to upload',
      supportedFormats: 'Supported formats: JPG, PNG, PDF (Max 5MB)',
      uploadButton: 'Choose File',
      fileName: 'File selected',
      removeFile: 'Remove',
      additionalNotes: 'Additional Notes (Optional)',
      notePlaceholder: 'Add any additional information about the payment...',
      submitPayment: 'Submit Payment',
      submitting: 'Submitting Payment...',
      confirming: 'Confirming Payment...',
      confirmation: 'Payment Submitted',
      confirmationMessage: 'Your payment has been submitted successfully. It will be verified by our admin team within 24-48 hours.',
      referenceSaved: 'Reference Code',
      paymentId: 'Payment ID',
      status: 'Status',
      pendingVerification: 'Pending Verification',
      trackStatus: 'Track Status',
      whatNext: 'What happens next?',
      nextSteps: [
        'Admin will verify your payment proof',
        'You will receive a notification when verified',
        'The hire will be confirmed and activated',
        'You can track the status anytime'
      ],
      goToHires: 'Go to My Hires',
      downloadReceipt: 'Download Receipt',
      errors: {
        fileRequired: 'Please upload proof of payment',
        fileSize: 'File size must be less than 5MB',
        fileType: 'Please upload a valid image or PDF file',
        referenceRequired: 'Please enter the reference code',
        nameRequired: 'Please enter your full name',
        phoneRequired: 'Please enter your phone number'
      },
      copy: 'Copy',
      copied: 'Copied!',
      copyReference: 'Copy Reference Code',
      processing: 'Processing...',
      timeEstimate: 'Estimated time',
      accountNumber: 'Account Number',
      iban: 'IBAN',
      swiftCode: 'SWIFT Code',
      bankName: 'Bank Name',
      branch: 'Branch',
      domesticTransfer: 'For domestic transfers, use Account Number only',
      internationalTransfer: 'For international transfers, use IBAN and SWIFT',
      contactSupport: 'Need help? Contact Support',
      languageToggle: 'العربية'
    },
    ar: {
      title: 'إكمال الدفع',
      subtitle: 'ادفع العمولة لتأكيد التوظيف',
      backToHires: 'العودة إلى التوظيفات',
      hireDetails: 'تفاصيل التوظيف',
      worker: 'العامل',
      employer: 'صاحب العمل',
      position: 'الوظيفة',
      salary: 'الراتب المتفق عليه',
      commission: 'العمولة (6.5%)',
      vat: 'ضريبة القيمة المضافة (14%)',
      totalDue: 'الإجمالي المستحق',
      referenceCode: 'رمز المرجع',
      paymentMethods: 'طرق الدفع',
      selectMethod: 'اختر طريقة الدفع المفضلة',
      chooseMethod: 'اختر طريقة الدفع',
      howToPay: 'كيفية الدفع',
      paymentSteps: 'اتبع هذه الخطوات لإكمال الدفع',
      paymentDetails: 'تفاصيل الدفع',
      recipient: 'المستلم',
      amount: 'المبلغ',
      method: 'الطريقة',
      reference: 'رمز المرجع',
      uploadProof: 'تحميل إثبات الدفع',
      uploadProofDesc: 'قم بتحميل لقطة شاشة لتأكيد الدفع',
      dragDrop: 'اسحب وأفلت أو انقر للتحميل',
      supportedFormats: 'الصيغ المدعومة: JPG, PNG, PDF (حد أقصى 5 ميجابايت)',
      uploadButton: 'اختيار ملف',
      fileName: 'الملف المحدد',
      removeFile: 'إزالة',
      additionalNotes: 'ملاحظات إضافية (اختياري)',
      notePlaceholder: 'أضف أي معلومات إضافية عن الدفع...',
      submitPayment: 'إرسال الدفع',
      submitting: 'جاري إرسال الدفع...',
      confirming: 'جاري تأكيد الدفع...',
      confirmation: 'تم إرسال الدفع',
      confirmationMessage: 'تم إرسال طلب الدفع بنجاح. سيتم التحقق منه من قبل فريق الإدارة خلال ٢٤-٤٨ ساعة.',
      referenceSaved: 'رمز المرجع',
      paymentId: 'معرف الدفع',
      status: 'الحالة',
      pendingVerification: 'قيد التحقق',
      trackStatus: 'تتبع الحالة',
      whatNext: 'ماذا يحدث بعد ذلك؟',
      nextSteps: [
        'سيتحقق المشرف من إثبات الدفع الخاص بك',
        'ستتلقى إشعاراً عند التحقق',
        'سيتم تأكيد التوظيف وتفعيله',
        'يمكنك تتبع الحالة في أي وقت'
      ],
      goToHires: 'الذهاب إلى التوظيفات',
      downloadReceipt: 'تحميل الإيصال',
      errors: {
        fileRequired: 'يرجى تحميل إثبات الدفع',
        fileSize: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت',
        fileType: 'يرجى تحميل صورة أو ملف PDF صحيح',
        referenceRequired: 'يرجى إدخال رمز المرجع',
        nameRequired: 'يرجى إدخال الاسم الكامل',
        phoneRequired: 'يرجى إدخال رقم الهاتف'
      },
      copy: 'نسخ',
      copied: 'تم النسخ!',
      copyReference: 'نسخ رمز المرجع',
      processing: 'جاري المعالجة...',
      timeEstimate: 'الوقت المتوقع',
      accountNumber: 'رقم الحساب',
      iban: 'الأيبان',
      swiftCode: 'رمز السويفت',
      bankName: 'اسم البنك',
      branch: 'الفرع',
      domesticTransfer: 'للتحويلات المحلية، استخدم رقم الحساب فقط',
      internationalTransfer: 'للتحويلات الدولية، استخدم الأيبان والسويفت',
      contactSupport: 'بحاجة إلى مساعدة؟ اتصل بالدعم',
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
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  // Generate reference code
  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `HS-${year}-${month}${day}-${random}`;
  };

  // Fetch hire details
  useEffect(() => {
    const fetchHireDetails = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch(`/api/hires/${hireId}`);
        // const data = await response.json();
        
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoHire = {
          id: hireId || 'HS-2026-0001',
          worker: {
            id: 'w1',
            name: 'Ahmed Ali',
            category: 'Nanny',
            rating: 4.9,
            location: 'Cairo, Egypt',
            phone: '+201234567890',
            email: 'ahmed@example.com',
            image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=100&h=100&fit=crop&crop=face'
          },
          employer: {
            id: 'e1',
            name: 'Sara Mohamed',
            phone: '+201234567891',
            email: 'sara@example.com'
          },
          position: 'Nanny - Full Time',
          agreedSalary: 3500,
          commissionAmount: 227.50,
          vatAmount: 31.85,
          totalDue: 3759.35,
          status: 'pending'
        };
        
        setHireDetails(demoHire);
        setPaymentReference(generateReference());
      } catch (error) {
        console.error('Error fetching hire details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHireDetails();
  }, [hireId]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: t.errors.fileSize }));
        return;
      }
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: t.errors.fileType }));
        return;
      }
      setUploadedFile(file);
      setUploadedFileName(file.name);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setUploadedFileName('');
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!uploadedFile) {
      newErrors.file = t.errors.fileRequired;
    }
    if (!formData.fullName) {
      newErrors.fullName = t.errors.nameRequired;
    }
    if (!formData.phone) {
      newErrors.phone = t.errors.phoneRequired;
    }
    if (!paymentReference) {
      newErrors.reference = t.errors.referenceRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In production, this would be an API call
      // const formDataToSend = new FormData();
      // formDataToSend.append('hireId', hireId);
      // formDataToSend.append('method', selectedMethod);
      // formDataToSend.append('reference', paymentReference);
      // formDataToSend.append('fullName', formData.fullName);
      // formDataToSend.append('phone', formData.phone);
      // formDataToSend.append('email', formData.email);
      // formDataToSend.append('note', formData.note);
      // formDataToSend.append('proof', uploadedFile);
      // const response = await fetch('/api/payments', {
      //   method: 'POST',
      //   body: formDataToSend
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus('pending');
      setShowConfirmation(true);
      setPaymentStep(3);
    } catch (error) {
      console.error('Error submitting payment:', error);
      setErrors({ general: 'Failed to submit payment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setPaymentStep(2);
  };

  // Get method details
  const getMethodDetails = () => {
    return paymentMethods[selectedMethod];
  };

  // Get payment amount display
  const getAmountDisplay = () => {
    if (!hireDetails) return 'EGP 0.00';
    return `EGP ${hireDetails.totalDue.toFixed(2)}`;
  };

  const isRTL = language === 'ar';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.processing}</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.confirmation}</h2>
            <p className="text-gray-600 mb-6">{t.confirmationMessage}</p>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t.paymentId}</p>
                  <p className="font-semibold text-gray-800">{paymentReference}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t.status}</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock size={14} />
                    {t.pendingVerification}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">{t.amount}</p>
                  <p className="font-semibold text-gray-800">{getAmountDisplay()}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t.method}</p>
                  <p className="font-semibold text-gray-800">
                    {getMethodDetails().label[language]}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">{t.whatNext}</h3>
              <div className="space-y-2">
                {t.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-red-600">{index + 1}</span>
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/my-hires"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t.goToHires}
              </Link>
              <button
                onClick={() => {
                  // Generate receipt
                  alert('Receipt download would be triggered here');
                }}
                className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t.downloadReceipt}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const method = getMethodDetails();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              to="/my-hires"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-2"
            >
              <ArrowLeft size={18} />
              {t.backToHires}
            </Link>
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

        {/* Hire Details */}
        {hireDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">{t.hireDetails}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={hireDetails.worker.image}
                  alt={hireDetails.worker.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="text-sm text-gray-500">{t.worker}</p>
                  <p className="font-medium text-gray-800">{hireDetails.worker.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {hireDetails.worker.rating}
                    <span className="mx-1">•</span>
                    <MapPin size={12} className="text-gray-400" />
                    {hireDetails.worker.location}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.position}</p>
                <p className="font-medium text-gray-800">{hireDetails.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.salary}</p>
                <p className="font-medium text-gray-800">EGP {hireDetails.agreedSalary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.referenceCode}</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium text-gray-800">{paymentReference}</p>
                  <button
                    onClick={() => copyToClipboard(paymentReference)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={t.copyReference}
                  >
                    {copySuccess === paymentReference ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.commission}</span>
                <span>EGP {hireDetails.commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.vat}</span>
                <span>EGP {hireDetails.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-800">{t.totalDue}</span>
                <span className="text-red-600">EGP {hireDetails.totalDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Steps */}
        {paymentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">{t.chooseMethod}</h2>
            <p className="text-gray-500 text-sm mb-6">{t.selectMethod}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(paymentMethods).map((key) => {
                const method = paymentMethods[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleMethodSelect(key)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === key
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                      selectedMethod === key ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {method.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800">{method.label[language]}</h3>
                    <p className="text-sm text-gray-500 mt-1">{method.description[language]}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock size={12} />
                      {method.processingTime[language]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        {paymentStep === 2 && method && (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Instructions */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Info size={18} className="text-red-600" />
                    {t.howToPay}
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">{t.paymentSteps}</p>
                  <div className="space-y-3">
                    {method.steps[language].map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-600">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bank Details */}
                  {selectedMethod === 'bank' && method.bankDetails && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-800 mb-3">{t.bankName} - {method.bankDetails.bankName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t.accountNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{method.bankDetails.accountNumber}</span>
                            <button
                              onClick={() => copyToClipboard(method.bankDetails.accountNumber)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {copySuccess === method.bankDetails.accountNumber ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t.iban}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-xs">{method.bankDetails.iban}</span>
                            <button
                              onClick={() => copyToClipboard(method.bankDetails.iban)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {copySuccess === method.bankDetails.iban ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t.swiftCode}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{method.bankDetails.swift}</span>
                            <button
                              onClick={() => copyToClipboard(method.bankDetails.swift)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {copySuccess === method.bankDetails.swift ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t.branch}</span>
                          <span className="font-medium">{method.bankDetails.branch}</span>
                        </div>
                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                          <p>{t.domesticTransfer}</p>
                          <p>{t.internationalTransfer}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recipient Info */}
                  {selectedMethod !== 'bank' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t.recipient}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-lg">{method.recipientNumber}</span>
                          <button
                            onClick={() => copyToClipboard(method.recipientNumber)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {copySuccess === method.recipientNumber ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">{t.amount}</span>
                        <span className="font-bold text-red-600 text-lg">{getAmountDisplay()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">{t.reference}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{paymentReference}</span>
                          <button
                            onClick={() => copyToClipboard(paymentReference)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {copySuccess === paymentReference ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4">{t.paymentDetails}</h2>

                  {/* Full Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.worker}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.fullName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder={t.worker}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.employer}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder={t.employer}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="you@example.com"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Upload Proof */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.uploadProof}
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400'
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.files = e.dataTransfer.files;
                          handleFileUpload({ target: { files: e.dataTransfer.files } });
                        }
                      }}
                    >
                      {uploadedFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={24} className="text-red-600" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-700">{uploadedFileName}</p>
                              <p className="text-xs text-gray-500">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="p-1 text-red-500 hover:text-red-600 transition-colors"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">{t.dragDrop}</p>
                          <p className="text-xs text-gray-400 mt-1">{t.supportedFormats}</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            {t.uploadButton}
                          </button>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                    {errors.file && (
                      <p className="mt-1 text-xs text-red-500">{errors.file}</p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.additionalNotes}
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      placeholder={t.notePlaceholder}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {t.submitting}
                      </>
                    ) : (
                      t.submitPayment
                    )}
                  </button>

                  <div className="mt-4 text-center">
                    <Link
                      to="/contact-support"
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                    >
                      {t.contactSupport}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Payment;