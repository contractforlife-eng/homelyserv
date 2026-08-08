// src/pages/PrivacyPolicy.jsx
// Privacy Policy — English + Arabic, public route /privacy.
// Draft legal copy; review by qualified legal counsel recommended before major commercial launch.
import React from 'react';
import LegalDocument from '../components/common/LegalDocument';

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    back: 'Back',
    lastUpdated: 'Last updated: August 8, 2026',
    subtitle:
      'This Privacy Policy explains what information HomelyServ collects, how it is used and shared, and the choices available to you. It applies to everyone who uses the HomelyServ platform.',
    sections: [
      {
        id: 'collected',
        heading: '1. Information We Collect',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may collect the following categories of information:'
          },
          {
            type: 'ul',
            items: [
              'Account information: name, email address, phone number, and authentication and account-security information (passwords are stored in protected, hashed form, not as readable plain text)',
              'Profile details: role (Worker, Employer, Support, or Admin), profile content, and preferences',
              'Contact data provided by users',
              'Images and documents uploaded by users',
              'Messages and communications sent within HomelyServ',
              'Complaints and support communications',
              'Transaction and payment metadata (not full payment-card numbers)',
              'Technical and security data, such as device and usage information, where actually collected'
            ]
          },
          {
            type: 'p',
            text: 'Some profile information is intended to be visible to other users according to the user’s role, platform functionality, and permissions — for example, a profile image, a name, and selected Worker profile details. Other information remains private or restricted to authorized HomelyServ personnel. Not every document uploaded by users is made public, and Support and Admin accounts are used to operate and support the platform rather than being publicly searchable.'
          }
        ]
      },
      {
        id: 'purpose',
        heading: '2. How We Use Your Information',
        blocks: [
          {
            type: 'ul',
            items: [
              'Operating your account and the platform',
              'Matching and search between Workers and Employers',
              'Providing messaging and communication tools',
              'Enabling hiring and payments',
              'Fraud prevention and security',
              'Providing support and handling complaints',
              'Legal compliance',
              'Improving our services'
            ]
          }
        ]
      },
      {
        id: 'payment',
        heading: '3. Payment Information',
        blocks: [
          {
            type: 'p',
            text: 'Payment processing is handled by external payment providers. HomelyServ does not store full payment-card numbers unless explicitly stated. Only the payment metadata necessary to record a transaction may be retained.'
          }
        ]
      },
      {
        id: 'sharing',
        heading: '4. Information Sharing',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may share information with:'
          },
          {
            type: 'ul',
            items: [
              'Service providers that help operate the platform',
              'Hosting, cloud, and infrastructure providers',
              'Image and media hosting providers (such as Cloudinary) that store uploaded images',
              'Email delivery and messaging providers',
              'Authentication and social login providers',
              'Payment processors and payment providers',
              'Legal authorities and competent state bodies, when required by law or a valid legal request',
              'Other users, only according to platform functionality and access permissions (for example, visible profile data)'
            ]
          },
          {
            type: 'p',
            text: 'We do not disclose your information beyond what is described in this Privacy Policy, except as required or permitted by applicable law.'
          }
        ]
      },
      {
        id: 'legal',
        heading: '5. Legal Requests and Disclosure',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may disclose available data when legally required by a competent authority through a valid legal process or order, to the extent required or permitted by law. HomelyServ is not obliged to disclose private user information to another user simply because that other user requests it.'
          }
        ]
      },
      {
        id: 'userdata',
        heading: '6. User-to-User Data',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ is not obliged to disclose private information about one user to another user merely because that other user requests it. When users voluntarily exchange contact details, HomelyServ does not control independent off-platform use of those details, subject to this Privacy Policy and applicable law. This does not displace data-protection duties that apply under mandatory law.'
          }
        ]
      },
      {
        id: 'communications',
        heading: '7. Communications',
        blocks: [
          {
            type: 'p',
            text: 'Internal messages are not necessarily monitored continuously. Authorized HomelyServ Admin or Support personnel may review communications available inside the platform when reasonably necessary for complaint handling, safety, fraud prevention, abuse investigation, security, enforcement of the Terms, or legal compliance, subject to applicable law.'
          },
          {
            type: 'p',
            text: 'Communications that occur outside the platform are generally outside HomelyServ’s control.'
          }
        ]
      },
      {
        id: 'security',
        heading: '8. Security',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ applies reasonable technical and organizational safeguards to protect your information. However, no method of transmission or storage can be guaranteed to be absolutely secure.'
          }
        ]
      },
      {
        id: 'retention',
        heading: '9. Data Retention',
        blocks: [
          {
            type: 'p',
            text: 'Deletion or closure of an account does not necessarily require the immediate deletion of every record. HomelyServ may retain information where retention is reasonably necessary for:'
          },
          {
            type: 'ul',
            items: [
              'transaction records',
              'fraud prevention and security',
              'complaint and dispute handling',
              'support and emergency handling',
              'legal compliance',
              'enforcement of rights and legitimate interests',
              'historical system integrity'
            ]
          },
          {
            type: 'p',
            text: 'HomelyServ retains information only as long as reasonably necessary or as required or permitted by applicable law. This policy does not define specific retention periods.'
          }
        ]
      },
      {
        id: 'international',
        heading: '10. International Data Processing',
        blocks: [
          {
            type: 'p',
            text: 'Service providers may process or store data in countries other than the data user’s country of residence. Where required, HomelyServ will handle such processing subject to the legal requirements that apply and to appropriate provider safeguards. HomelyServ does not promise a specific cross-border transfer mechanism unless and until it is confirmed and lawfully available.'
          }
        ]
      },
      {
        id: 'social',
        heading: '11. Social Login',
        blocks: [
          {
            type: 'p',
            text: 'If you sign in through Google or another supported third-party authentication provider, HomelyServ may receive information made available by that provider and authorized by you — such as your name, email address, and profile image — subject to that provider’s permissions, settings, and policies. HomelyServ does not access additional account data beyond what the provider makes available.'
          }
        ]
      },
      {
        id: 'children',
        heading: '12. Children',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ’s platform is intended for users aged 18 and older and is not intentionally directed to children. If we become aware that we have collected information belonging to a child in a way that is not legally permitted, we will take appropriate steps consistent with applicable law.'
          }
        ]
      },
      {
        id: 'rights',
        heading: '13. Your Rights',
        blocks: [
          {
            type: 'p',
            text: 'You may have rights under applicable law in relation to your data. Where these rights apply, you may request access to, correction, deletion, or restriction of your data by contacting us. Where applicable law does not grant a specific right, it does not apply.'
          }
        ]
      },
      {
        id: 'updates',
        heading: '14. Policy Updates',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may update this Privacy Policy from time to time. If we make material changes, we will communicate them where practical, and the “last updated” date at the top of this page will be revised accordingly.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '15. Contact',
        blocks: [
          {
            type: 'p',
            text: 'For privacy questions, contact us at support@homelyserv.com, call +20 100 918 9851, or visit our Contact page. HomelyServ operates from Cairo, Egypt.'
          }
        ]
      }
    ],
    notice:
      'This policy is a product/legal draft and should be reviewed by qualified legal counsel before major commercial launch.'
  },

  ar: {
    title: 'سياسة الخصوصية',
    back: 'رجوع',
    lastUpdated: 'آخر تحديث: 8 أغسطس 2026',
    subtitle:
      'توضح سياسة الخصوصية هذه المعلومات التي تجمعها منصة HomelyServ وكيفية استخدامها ومشاركتها، والخيارات المتاحة لك، وتسري على كل من يستخدم المنصة.',
    sections: [
      {
        id: 'collected',
        heading: '1. المعلومات التي نجمعها',
        blocks: [
          {
            type: 'p',
            text: 'قد تجمع المنصة الفئات التالية من المعلومات:'
          },
          {
            type: 'ul',
            items: [
              'معلومات الحساب: الاسم والبريد الإلكتروني ورقم الهاتف ومعلومات المصادقة وأمان الحساب (تُخزَّن كلمات المرور في صورة مشفّرة محمية، وليس كنص عادي قابل للقراءة)',
              'تفاصيل الملف الشخصي: الدور (عامل، صاحب عمل، دعم، أو إدارة) ومحتوى الملف وتفضيلاته',
              'بيانات الاتصال التي يقدمها المستخدمون',
              'الصور والمستندات التي يرفعها المستخدمون',
              'الرسائل والمراسلات المرسلة داخل المنصة',
              'الشكاوى ومراسلات الدعم',
              'بيانات المعاملات والمعلومات المالية الضرورية (وليس أرقام البطاقات الكاملة)',
              'البيانات التقنية والأمنية مثل بيانات الأجهزة والاستخدام عند جمعها فعليًا'
            ]
          },
          {
            type: 'p',
            text: 'بعض معلومات الملف الشخصي يُقصَد بها أن تكون مرئية للمستخدمين الآخرين وفقًا لدور المستخدم ووظائف المنصة وصلاحيات الوصول، مثل الصورة الرمزية والاسم وبعض تفاصيل ملفات العمال، بينما تظل معلومات أخرى خاصة أو مقيدة بموظفي المنصة المصرح لهم، ولا تصبح كل مستند مرفوع متاحًا للجميع، وحسابات الدعم والإدارة مخصصة لتشغيل المنصة ودعمها وليست قابلة للبحث العام.'
          }
        ]
      },
      {
        id: 'purpose',
        heading: '2. كيف نستخدم معلوماتك',
        blocks: [
          {
            type: 'ul',
            items: [
              'تشغيل حسابك والمنصة',
              'البحث والمطابقة بين العمال وأصحاب العمل',
              'توفير أدوات الرسائل والتواصل',
              'دعم التعيين والمدفوعات',
              'منع الاحتيال وضمان الأمن',
              'معالجة الدعم والشكاوى',
              'الامتثال القانوني',
              'تحسين خدماتنا'
            ]
          }
        ]
      },
      {
        id: 'payment',
        heading: '3. معلومات الدفع',
        blocks: [
          {
            type: 'p',
            text: 'تتم معالجة الدفع عبر مزودي دفع خارجيين، ولا تخزن المنصة أرقام بطاقات الدفع الكاملة ما لم يُذكر صراحة، وقد تُحتفظ فقط ببيانات المعاملات الضرورية لتسجيل الدفع.'
          }
        ]
      },
      {
        id: 'sharing',
        heading: '4. مشاركة المعلومات',
        blocks: [
          {
            type: 'p',
            text: 'قد تشارك المنصة المعلومات مع:'
          },
          {
            type: 'ul',
            items: [
              'مزودي الخدمة الذين يساعدون في تشغيل المنصة',
              'مزودي الاستضافة والحوسبة السحابية والبنية التحتية',
              'مزودي استضافة الصور والوسائط (مثل Cloudinary) الذين يخزنون صور المستخدمين',
              'مزودي البريد الإلكتروني والرسائل',
              'مزودي المصادقة وتسجيل الدخول الاجتماعي',
              'معالجي الدفع ومزوّديه',
              'السلطات القانونية المختصة، عند الاقتضاء القانوني أو بطلب أو أمر قانوني صحيح',
              'المستخدمين الآخرين وفق وظائف المنصة وصلاحيات الوصول فقط (مثل بيانات الملف المرئية)'
            ]
          },
          {
            type: 'p',
            text: 'لا نفصح عن معلوماتك بأكثر مما سبق ذكره في سياسة الخصوصية هذه، إلا بما يقتضيه القانون المعمول به أو يسمح به.'
          }
        ]
      },
      {
        id: 'legal',
        heading: '5. الطلبات القانونية والإفشاء',
        blocks: [
          {
            type: 'p',
            text: 'يجوز للمنصة الكشف عن البيانات المتاحة عندما يلزم القانون ذلك عبر سلطة مختصة أو أمر قضائي صحيح، وفق المطلوب وبما يسمح به القانون، كما أنها غير ملزمة بالإفصاح عن المعلومات الخاصة عن أحد المستخدمين لمستخدم آخر لمجرد طلبه.'
          }
        ]
      },
      {
        id: 'userdata',
        heading: '6. البيانات بين المستخدمين',
        blocks: [
          {
            type: 'p',
            text: 'المنصة غير ملزمة بالإفصاح عن المعلومات الخاصة عن أحد المستخدمين لصالح مستخدم آخر لمجرد طلبه. عندما يتداول المستخدمون بيانات الاتصال طوعًا، لا تتحكم المنصة في الاستخدام المستقل لهذه البيانات خارج المنصة، وفق سياسة الخصوصية هذه والقانون المعمول به، ولا يسقط ذلك واجبات حماية البيانات المنصوص عليها قانونًا.'
          }
        ]
      },
      {
        id: 'communications',
        heading: '7. المراسلات',
        blocks: [
          {
            type: 'p',
            text: 'لا تُراجَع الرسائل الداخلية بشكل مستمر بالضرورة، وقد يراجع موظفو المنصة (الدعم أو الإدارة) المصرح لهم المراسلات المتاحة داخل المنصة عند الحاجة المعقولة لمعالجة الشكاوى أو السلامة أو منع الاحتيال أو التحقيق في الإساءة أو الأمن أو إنفاذ الشروط أو الامتثال القانوني، وفق القانون المعمول به.'
          },
          {
            type: 'p',
            text: 'المحادثات التي تتم خارج المنصة عمومًا خارج نطاق إشرافها وسيطرتها.'
          }
        ]
      },
      {
        id: 'security',
        heading: '8. الأمان',
        blocks: [
          {
            type: 'p',
            text: 'تطبق المنصة تدابير حماية تقنية وتنظيمية معقولة لحماية بياناتك، لكن لا يمكن ضمان أمان أي وسيلة إرسال أو تخزين بشكل مطلق.'
          }
        ]
      },
      {
        id: 'retention',
        heading: '9. الاحتفاظ بالبيانات',
        blocks: [
          {
            type: 'p',
            text: 'لا يستلزم حذف الحساب أو إغلاقه الحذف الفوري لكل سجل، وقد تُبقي المنصة بعض المعلومات حيث تستدعي الحاجة المعقولة إلى:'
          },
          {
            type: 'ul',
            items: [
              'سجلات المعاملات',
              'منع الاحتيال والأمن',
              'معالجة الشكاوى والنزاعات',
              'معالجة حالات الطوارئ والدعم',
              'الامتثال القانوني',
              'إنفاذ الحقوق والمصالح المشروعة',
              'سلامة النظم تاريخيًا'
            ]
          },
          {
            type: 'p',
            text: 'تحتفظ المنصة بالمعلومات فقط للمدة المطلوبة بشكل معقول أو المقررة أو التي يسمح بها القانون، وهذه السياسة لا تحدد مدد احتفاظ محددة.'
          }
        ]
      },
      {
        id: 'international',
        heading: '10. معالجة البيانات الدولية',
        blocks: [
          {
            type: 'p',
            text: 'قد يعالج مزودو الخدمة البيانات أو يخزنوها في دول خارج دولة المستخدم، وعند الاقتضاء تتعامل المنصة مع ذلك وفق المتطلبات القانونية الواجبة التطبيق وبضمانات مناسبة من مزودي الخدمة، ولا تعِد المنصة بآلية محددة لنقل البيانات عبر الحدود ما لم تكن مؤكدة ومسموحًا بها قانونًا.'
          }
        ]
      },
      {
        id: 'social',
        heading: '11. تسجيل الدخول عبر الطرف الثالث',
        blocks: [
          {
            type: 'p',
            text: 'إذا سجّلت الدخول عبر جوجل أو أي مزود مصادقة آخر مدعوم من طرف ثالث، فقد تتلقى المنصة المعلومات المتاحة من ذلك المزود والمصرح بها منك، مثل اسمك وبريدك الإلكتروني وصورتك الرمزية، وفق صلاحيات ذلك المزود وإعداداته وسياساته، ولا تحصل المنصة على بيانات إضافية عن الحساب بما لا يقدمه المزود.'
          }
        ]
      },
      {
        id: 'children',
        heading: '12. الأطفال',
        blocks: [
          {
            type: 'p',
            text: 'منصة HomelyServ موجهة إلى المستخدمين الذين تبلغ أعمارهم 18 عامًا أو أكثر، وهي لا تستهدف الأطفال عمدًا، إذا تبين للمنصة أنها جمعت معلومات تخص طفلًا في ظرف لا يجيزه القانون، فقد تتخذ الخطوات المناسبة وفق القانون المعمول به.'
          }
        ]
      },
      {
        id: 'rights',
        heading: '13. حقوقك',
        blocks: [
          {
            type: 'p',
            text: 'قد تكون لك حقوق وفق القانون المعمول به تتعلق ببياناتك، وتسري هذه الحقوق عند توفرها، وتواصل معنا لممارستها بإمكانك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو تقييدها، وإذا لم يمنح القانون المعمول به حقًا محددًا فلا يُطبَّق.'
          }
        ]
      },
      {
        id: 'updates',
        heading: '14. تحديثات السياسة',
        blocks: [
          {
            type: 'p',
            text: 'قد تحدّث المنصة سياسة الخصوصية هذه من وقت لآخر، وعند إجراء تغييرات جوهرية، قد يتم الإعلان عنها حيثما أمكن، ويُحدَّث تاريخ «آخر تحديث» الموضح أعلى هذه الصفحة عند التعديل.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '15. التواصل',
        blocks: [
          {
            type: 'p',
            text: 'للاستفسارات المتعلقة بالخصوصية، تواصل معنا عبر البريد الإلكتروني support@homelyserv.com أو الهاتف +20 100 918 9851 أو عبر صفحة اتصل بنا، وتعمل المنصة من القاهرة، مصر.'
          }
        ]
      }
    ],
    notice:
      'هذه السياسة مسودة قانونية أولية وينبغي مراجعتها من قبل مستشار قانوني مؤهل قبل الإطلاق التجاري الكبير.'
  }
};

const PrivacyPolicy = () => <LegalDocument content={CONTENT} />;

export default PrivacyPolicy;