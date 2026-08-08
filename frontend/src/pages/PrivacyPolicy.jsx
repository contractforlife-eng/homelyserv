// src/pages/PrivacyPolicy.jsx
// Privacy Policy — English + Arabic, public route /privacy.
// Draft legal copy; review by qualified legal counsel recommended.
import React from 'react';
import LegalDocument from '../components/common/LegalDocument';

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    back: 'Back',
    lastUpdated: 'Last updated: June 27, 2026',
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
              'Account information: name, email address, phone number, login credentials',
              'Profile details: role (Worker or Employer), profile content, and preferences',
              'Contact data provided by users',
              'Images and documents uploaded by users',
              'Worker profile data and Employer profile data',
              'Messages sent within HomelyServ',
              'Complaints and support communications',
              'Transaction and payment metadata (not full card numbers)',
              'Technical and security data, such as device and usage information, where actually collected'
            ]
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
            text: 'Payment processing is handled by external payment providers. HomelyServ does not store full payment-card numbers unless explicitly stated. Only payment metadata necessary to record a transaction may be retained.'
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
              'Payment processors and payment providers',
              'Hosting and cloud vendors',
              'Legal authorities and competent state bodies where required by law or a valid legal request',
              'Other users, only according to platform functionality and access permissions'
            ]
          }
        ]
      },
      {
        id: 'legal',
        heading: '5. Legal Requests and Disclosure',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may disclose available data when legally required by a competent authority through a valid legal request or order, to the extent required or permitted by law. HomelyServ is not obligated to disclose private user information to another user simply because that user requests it.'
          }
        ]
      },
      {
        id: 'userdata',
        heading: '6. User-to-User Data',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ is not obligated to disclose private information about one user to another user merely because that other user requests it. If users voluntarily exchange contact details with each other, HomelyServ is not responsible for how users later use those details, subject to applicable law.'
          }
        ]
      },
      {
        id: 'communications',
        heading: '7. Communications',
        blocks: [
          {
            type: 'p',
            text: 'Messages you send inside HomelyServ may be reviewed when reasonably necessary for safety, support, complaint handling, and legal compliance. Communications that occur outside the platform are generally outside HomelyServ’s control.'
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
            text: 'We keep information only as long as reasonably needed for the operation of the service, legal and security purposes, and dispute handling, subject to applicable law.'
          }
        ]
      },
      {
        id: 'rights',
        heading: '10. Your Rights',
        blocks: [
          {
            type: 'p',
            text: 'You may have rights under applicable law in relation to your data. Where these rights apply, you may request access to, correction, deletion, or restriction of your data by contacting us. Where applicable law does not grant a specific right, it does not apply.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '11. Contact',
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
    lastUpdated: 'آخر تحديث: 27 يونيو 2026',
    subtitle:
      'توضح سياسة الخصوصية هذه المعلومات التي تجمعها منصة HomelyServ وكيفية استخدامها وحقوقك المتاحة، وتسري على كل من يستخدم المنصة.',
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
              'معلومات الحساب: الاسم والبريد الإلكتروني ورقم الهاتف وكلمة المرور',
              'تفاصيل الملف الشخصي: الدور (عامل أو صاحب عمل) ومحتوى الملف',
              'بيانات الاتصال التي يقدمها المستخدمون',
              'الصور والمستندات التي يرفعها المستخدمون',
              'بيانات ملفات العمال وأصحاب العمل',
              'الرسائل المرسلة داخل المنصة',
              'الشكاوى ومراسلات الدعم',
              'بيانات المعاملات والمعلومات المالية الضرورية (وليس أرقام البطاقات الكاملة)',
              'البيانات التقنية والأمنية مثل سجلات الأجهزة عند جمعها فعليًا'
            ]
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
              'تشغيل المنصة وتوفير الخدمات',
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
            text: 'تتم معالجة الدفع عبر مزودي دفع خارجيين، ولا تخزن المنصة أرقام بطاقات الدفع الكاملة ما لم يُذكر خلاف ذلك، وقد تُحتفظ ببيانات المعاملات الضرورية لتسجيل الدفع فقط.'
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
              'مؤدوا الخدمة الذين يساعدون في تشغيل المنصة',
              'معالجو الدفع ومزودوه',
              'مزودو الاستضافة والحوسبة السحابية',
              'الجهات القانونية المعنية ووفق طلب أو أمر قانوني صحيح',
              'المستخدمين الآخرين وفق وظائف المنصة وصلاحيات الوصول فقط'
            ]
          }
        ]
      },
      {
        id: 'legal',
        heading: '5. الطلبات القانونية والإفشاء',
        blocks: [
          {
            type: 'p',
            text: 'يجوز للمنصة أن تكشف البيانات المتاحة عندما يلزم القانون ذلك بناءً على طلب أو أمر قانوني صحيح من جهة مختصة، ووفق المطلوب قانونًا. والمنصة ليست ملزمة بالإفصاح عن معلومات خاصة عن أي مستخدم لمستخدم آخر لمجرد طلبه.'
          }
        ]
      },
      {
        id: 'userdata',
        heading: '6. البيانات بين المستخدمين',
        blocks: [
          {
            type: 'p',
            text: 'ليست المنصة ملزمة بالإفصاح عن معلومات خاصة بمستخدم لصالح مستخدم آخر لمجرد طلبه. إذا تبادل المستخدمون بيانات التواصل طوعًا فيما بينهم، فلا تكون المنصة مسؤولة عن كيفية استخدامها لاحقًا.'
          }
        ]
      },
      {
        id: 'communications',
        heading: '7. المراسلات',
        blocks: [
          {
            type: 'p',
            text: 'قد تراجع المنصة الرسائل المرسلة داخل المنصة عندما يكون ذلك ضروريًا بشكل معقول للسلامة أو الخصوصية أو معالجة الشكاوى أو الامتثال القانوني، والمحادثات التي تجري خارج المنصة عمومًا خارج نطاق المنصة.'
          }
        ]
      },
      {
        id: 'security',
        heading: '8. الأمان',
        blocks: [
          {
            type: 'p',
            text: 'تطبق المنصة إجراءات حماية تقنية وتنظيمية معقولة؛ لكن لا يمكن ضمان أمان أي وسيلة نقل أو تخزين بشكل مطلق.'
          }
        ]
      },
      {
        id: 'retention',
        heading: '9. الاحتفاظ بالبيانات',
        blocks: [
          {
            type: 'p',
            text: 'نحتفظ بالبيانات فقط طوال الفترة المطلوبة بشكل معقول لتشغيل الخدمة وللأغراض القانونية والأمنية ومعالجة الشكاوى، وذلك وفق القانون المعمول به.'
          }
        ]
      },
      {
        id: 'rights',
        heading: '10. حقوقك',
        blocks: [
          {
            type: 'p',
            text: 'قد تكون لك حقوق بموجب القانون المعمول به تتعلق ببياناتك، وتسري هذه الحقوق عند توفرها، وتواصل معنا لممارستها. وإذا لم يمنح القانون المعمول به حقًا محددًا، فلا يُطبق.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '11. التواصل',
        blocks: [
          {
            type: 'p',
            text: 'للاستفسارات المتعلقة بالخصوصية، تواصل معنا على البريد الإلكتروني support@homelyserv.com أو الهاتف +20 100 918 9851 أو عبر صفحة اتصل بنا. تعمل المنصة من القاهرة، مصر.'
          }
        ]
      }
    ],
    notice:
      'هذه السياسة مسودة قانونية أولية ويجب مراجعتها من مستشار قانوني مؤهل قبل الإطلاق التجاري الكبير.'
  }
};

const PrivacyPolicy = () => <LegalDocument content={CONTENT} />;

export default PrivacyPolicy;