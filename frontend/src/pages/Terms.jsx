// src/pages/Terms.jsx
// Terms & Conditions — English + Arabic, public route /terms.
// Draft legal copy; review by qualified legal counsel recommended before major commercial launch.
import React from 'react';
import LegalDocument from '../components/common/LegalDocument';

const CONTENT = {
  en: {
    title: 'Terms & Conditions',
    back: 'Back',
    lastUpdated: 'Last updated: August 8, 2026',
    subtitle:
      'These Terms & Conditions ("Terms") govern your access to and use of the HomelyServ platform. Please read them carefully before using our services.',
    sections: [
      {
        id: 'platform',
        heading: '1. The Platform',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ is a technology and intermediary platform that facilitates discovery, communication, and connection between Employers and Workers/service providers. HomelyServ provides technology and tools that help users find one another and communicate; it does not itself perform the underlying work.'
          },
          {
            type: 'p',
            text: 'To the maximum extent permitted by applicable law, nothing in these Terms purports to override mandatory provisions of law that cannot legally be excluded or varied.'
          },
          {
            type: 'callout',
            title: 'HomelyServ is NOT:',
            items: [
              'the Worker’s employer',
              'the Employer’s representative',
              'an employment agency, unless explicitly required or defined by applicable law',
              'a party to, or automatically part of, the employment or service agreement between users',
              'a guarantor of either party',
              'a police authority',
              'a judicial authority',
              'an investigative authority',
              'a tracking, search, or tracing agency'
            ]
          },
          {
            type: 'p',
            text: 'The presence of a user on HomelyServ does not imply prior personal knowledge, endorsement, guarantee, or any relationship with that user by HomelyServ.'
          }
        ]
      },
      {
        id: 'accounts',
        heading: '2. User Accounts',
        blocks: [
          {
            type: 'p',
            text: 'You must be at least 18 years old to create an account. You are responsible for the security of your authentication credentials and for all activities that occur under your account. You must immediately notify HomelyServ if you suspect unauthorized access.'
          }
        ]
      },
      {
        id: 'responsibility',
        heading: '3. User Responsibility and Data Accuracy',
        blocks: [
          {
            type: 'p',
            text: 'Each user is solely responsible for:'
          },
          {
            type: 'ul',
            items: [
              'the accuracy of submitted account information',
              'identity information and documents',
              'qualifications, skills, and experience',
              'profile content',
              'job and service descriptions',
              'legal eligibility to work or hire',
              'personal conduct on and off the platform'
            ]
          },
          {
            type: 'p',
            text: 'Unless HomelyServ explicitly states that a specific item was verified, HomelyService does not guarantee the truth, authenticity, completeness, or current accuracy of user-submitted data. Each party must independently evaluate and verify the other party before entering into any relationship.'
          }
        ]
      },
      {
        id: 'types',
        heading: '4. User Types',
        blocks: [
          {
            type: 'def',
            rows: [
              {
                label: 'Workers (Job Seekers)',
                desc: 'Create profiles, upload documents, and apply for jobs or offers.'
              },
              {
                label: 'Employers',
                desc: 'Post jobs or offers, search for workers, and manage hires.'
              },
              {
                label: 'Support and Admin',
                desc: 'Platform personnel who operate, review, and support the platform in the amount of their authorized roles.'
              }
            ]
          }
        ]
      },
      {
        id: 'relationship',
        heading: '5. Employment and Work Relationship',
        blocks: [
          {
            type: 'p',
            text: 'Any employment, work, service, salary, working hours, leave, accommodation, duties, workplace rules, termination, taxes, insurance, permits, immigration or residency requirements, or other legal obligations are primarily the responsibility of the Worker and the Employer under applicable law.'
          },
          {
            type: 'p',
            text: 'Homely does not supervise day-to-day work and does not control the Worker’s performance.'
          },
          {
            type: 'callout',
            title: 'HomelyServ does not guarantee:',
            items: [
              'employment continuation',
              'Worker attendance',
              'Employer conduct',
              'quality of work',
              'payment of salary',
              'a successful relationship outcome'
            ]
          }
        ]
      },
      {
        id: 'safety',
        heading: '6. Property, Safety, and User-to-User Conduct',
        blocks: [
          {
            type: 'p',
            text: 'To the maximum extent permitted by applicable law, HomelyServ does not guarantee or insure against loss arising from user-to-user conduct, including where that conduct occurs on or off the platform, and including where applicable:'
          },
          {
            type: 'ul',
            items: [
              'theft',
              'loss of property',
              'property damage',
              'personal injury',
              'assault',
              'misconduct',
              'negligence',
              'breach of an agreement',
              'disappearance or failure to attend',
              'other acts or omissions by a Worker or an Employer'
            ]
          },
          {
            type: 'p',
            text: 'Homely is not a guarantor of either user’s conduct. Nothing in this section limits or excludes liability that cannot lawfully be limited or excluded under applicable law.'
          }
        ]
      },
      {
        id: 'conduct',
        heading: '7. Prohibited Conduct',
        blocks: [
          {
            type: 'p',
            text: 'You may not use the platform to:'
          },
          {
            type: 'ul',
            items: [
              'commit or facilitate fraud',
              'impersonate any person or entity, or submit false documents',
              'engage in illegal activity',
              'harass, threaten, or abuse others',
              'post abusive, defamatory, or misleading content',
              'misuse other users’ personal data',
              'attempt to bypass platform security or payment controls',
              'commit payment fraud',
              'gain unauthorized access to another user’s account'
            ]
          },
          {
            type: 'p',
            text: 'HomelyServ may suspend or remove accounts or content for violations of these Terms. Reports of suspected misconduct are investigated through the platform’s complaint and support process.'
          }
        ]
      },
      {
        id: 'payments',
        heading: '8. Payments and Commission',
        blocks: [
          {
            type: 'p',
            text: 'Employers are charged the applicable platform recruitment commission of 15% of the agreed monthly salary, as displayed to the Employer at the time of payment. Payment is completed through payment methods and third-party payment providers made available by HomelyServ at the time of payment, which may currently include Paymob and PayPal.'
          },
          {
            type: 'p',
            text: 'The currency used in the applicable checkout or payment flow is shown before payment. HomelyServ currently operates primarily in Egyptian Pounds (EGP). Commission rates and fee structures may be updated over time; the applicable rate is shown before you confirm payment.'
          },
          {
            type: 'link',
            text: 'Payments and platform commissions are subject to the Refund & Cancellation Policy, available at:',
            href: '/refund-policy',
            label: '/refund-policy'
          }
        ]
      },
      {
        id: 'providers',
        heading: '9. Third-Party Payment Providers',
        blocks: [
          {
            type: 'p',
            text: 'Payment processing may be performed by third-party payment providers. HomelyServ does not store full payment-card credentials unless explicitly stated.'
          },
          {
            type: 'ul',
            items: [
              'Payment providers may apply their own terms and conditions.',
              'Payment providers may conduct their own verification and fraud checks.',
              'Payment providers may apply their own processing rules and timelines.'
            ]
          }
        ]
      },
      {
        id: 'termination',
        heading: '10. Termination and Suspension',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may suspend or terminate accounts for violations of these Terms, suspected fraud, safety or security concerns, unlawful activity, or misuse of the platform.'
          },
          {
            type: 'p',
            text: 'Users remain responsible for obligations incurred before suspension or termination.'
          }
        ]
      },
      {
        id: 'disputes',
        heading: '11. Legal Disputes',
        blocks: [
          {
            type: 'p',
            text: 'Disputes between a Worker and an Employer may be civil, criminal, employment or labor related, financial, contractual, or personal. Homely is not automatically a party to such disputes.'
          },
          {
            type: 'callout',
            title: 'To the maximum extent permitted by applicable law, HomelyServ is not required to:',
            items: [
              'voluntarily attend court proceedings',
              'represent either user',
              'pay legal costs',
              'provide legal assistance',
              'act as arbitrator or judge'
            ]
          },
          {
            type: 'p',
            text: 'However, where required to do so by applicable law, or by a valid order or request from a competent authority, HomelyServ will respond and cooperate as required.'
          }
        ]
      },
      {
        id: 'location',
        heading: '12. User Location and Finding Users',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ is not a tracking, search, tracing, law-enforcement, or investigation service. HomelyService does not guarantee knowledge of any user’s current physical location and is not obliged to locate, find, track, contact, or recover any Worker or Employer on behalf of another user.'
          },
          {
            type: 'p',
            text: 'Any location or address information shown on the platform is based on available data and does not guarantee the current whereabouts of any user. Valid legal requests issued by competent authorities are handled in accordance with the law and the Privacy Policy.'
          }
        ]
      },
      {
        id: 'disclosure',
        heading: '13. Personal Data Disclosure',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ is not required to provide one user with another user’s phone number, address, identity information, documents, location, private records, or other confidential information simply because that user requests it or because a dispute exists.'
          },
          {
            type: 'p',
            text: 'Disclosure of user data is governed by the Privacy Policy, applicable law, and valid legal requests or orders. If users voluntarily exchange contact details, Homely does not control the independent use of contact information exchanged beyond the platform’s intended functionality, subject to applicable law, the Privacy Policy, and these Terms.'
          }
        ]
      },
      {
        id: 'communication',
        heading: '14. Conversations and Communication',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may provide internal messaging tools. Statements, promises, commitments, negotiations, salary agreements, work arrangements, and personal representations made between users do not represent HomelyServ and do not bind HomelyServ — whether communicated:'
          },
          {
            type: 'def',
            rows: [
              {
                label: 'Inside HomelyServ',
                desc: 'through internal messaging and chat tools.'
              },
              {
                label: 'Outside HomelyServ',
                desc: 'through WhatsApp, phone, email, social media, face-to-face meetings, or any other external communication platform.'
              }
            ]
          },
          {
            type: 'p',
            text: 'HomelyServ does not guarantee the truthfulness of statements or the performance of promises made between users.'
          }
        ]
      },
      {
        id: 'review',
        heading: '15. Message Review and Platform Access',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may review communications available within the platform if reasonably necessary for safety, fraud prevention, complaint handling, enforcement of these Terms, security, abuse investigation, or legal compliance, subject to the Privacy Policy and applicable law. Review is not continuous unless required.'
          },
          {
            type: 'p',
            text: 'Conversations that take place outside the platform generally cannot be monitored, verified, recovered, or guaranteed by HomelyServ.'
          }
        ]
      },
      {
        id: 'complaints',
        heading: '16. Complaints and Support System',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may provide complaint and support mechanisms, including complaint review, account review, suspension, internal investigation, administrative assistance, and support communication.'
          },
          {
            type: 'p',
            text: 'Providing these services does not make HomelyServ an employer, a guarantor, a court, an arbitrator, or a party to the underlying dispute. HomelyServ may take account-related action under its own policies.'
          }
        ]
      },
      {
        id: 'limitation',
        heading: '17. Limitation of Liability',
        blocks: [
          {
            type: 'p',
            text: 'To the maximum extent permitted by applicable law, HomelyServ shall not be directly or indirectly responsible for:'
          },
          {
            type: 'ul',
            items: [
              'user-to-user conduct, misconduct, or negligence, including the risks described in section 6',
              'user-provided content or information',
              'employment or service disputes between users',
              'communication that takes place outside the platform',
              'promises or commitments made between users',
              'loss caused by the conduct of third parties'
            ]
          },
          {
            type: 'p',
            text: 'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.'
          }
        ]
      },
      {
        id: 'law',
        heading: '18. Governing Law',
        blocks: [
          {
            type: 'p',
            text: 'These Terms are governed by the applicable laws relevant to HomelyServ and the transaction or user relationship, subject to mandatory consumer, employment, privacy, and other laws that cannot legally be excluded.'
          }
        ]
      },
      {
        id: 'changes',
        heading: '19. Changes to These Terms',
        blocks: [
          {
            type: 'p',
            text: 'HomelyServ may update these Terms from time to time. Material changes are communicated where practical. Continued use of the platform after changes take effect may constitute acceptance where permitted by law.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '20. Contact',
        blocks: [
          {
            type: 'p',
            text: 'If you have questions about these Terms, please contact us at support@homelyserv.com, call +20 100 918 9851, or visit our Contact page. HomelyServ operates from Cairo, Egypt.'
          }
        ]
      }
    ],
    notice:
      'These are product/legal draft documents and should be reviewed by qualified legal counsel before major commercial launch.'
  },

  ar: {
    title: 'الشروط والأحكام',
    back: 'رجوع',
    lastUpdated: 'آخر تحديث: 8 أغسطس 2026',
    subtitle:
      'تسري هذه الشروط والأحكام («الشروط») على وصولك إلى منصة HomelyServ واستخدامك لها. يرجى قراءة الشروط بعناية قبل استخدام خدماتنا.',
    sections: [
      {
        id: 'platform',
        heading: '1. المنصة',
        blocks: [
          {
            type: 'p',
            text: 'منصة HomelyServ هي منصة تقنية ووسيط تسهّل الاكتشاف والتواصل والربط بين أصحاب العمل والعمال ومقدمي الخدمات. توفر المنصة تقنيات وأدوات تساعد المستخدمين في إيجاد بعضهم البعض والتواصل، ولا تقوم بنفسها بتنفيذ العمل الأساسي.'
          },
          {
            type: 'p',
            text: 'إلى الحد الأقصى المسموح به قانونًا، لا تهدف هذه الشروط إلى تجاوز أي أحكام إلزامية في القانون المعمول به.'
          },
          {
            type: 'callout',
            title: 'منصة HomelyServ ليست:',
            items: [
              'صاحب عمل للعامل',
              'ممثلة عن صاحب العمل',
              'وكالة توظيف، إلا إذا نص القانون المعمول به صراحةً على ذلك أو عرّفها بذلك',
              'طرفًا في اتفاقية العمل أو الخدمة بين المستخدمين، أو طرفًا تلقائيًا فيها',
              'ضامنة لأي من الطرفين',
              'سلطة شرطة',
              'سلطة قضائية',
              'سلطة تحقيق',
              'خدمة تتبع أو بحث أو تعقب'
            ]
          },
          {
            type: 'p',
            text: 'إن وجود مستخدم على المنصة لا يعني بالضرورة معرفة شخصية سابقة به، أو تأييدًا له، أو ضمانًا له، أو أيًا كانت نوع العلاقة بينه وبين المنصة.'
          }
        ]
      },
      {
        id: 'accounts',
        heading: '2. حسابات المستخدمين',
        blocks: [
          {
            type: 'p',
            text: 'يجب أن تكون من عمر 18 عامًا على الأقل لإنشاء حساب. أنت مسؤول عن أمان بيانات الدخول وعن جميع الأنشطة التي تتم تحت حسابك، وعليك إبلاغ المنصة فورًا إذا اشتبهت في وصول غير مصرح به.'
          }
        ]
      },
      {
        id: 'responsibility',
        heading: '3. مسؤولية المستخدم ودقة البيانات',
        blocks: [
          {
            type: 'p',
            text: 'كل مستخدم مسؤول وحده عن:'
          },
          {
            type: 'ul',
            items: [
              'دقة المعلومات المقدمة عند إنشاء الحساب',
              'بيانات المستندات والهوية',
              'المؤهلات والمهارات والخبرة',
              'محتوى الملف الشخصي',
              'أوصاف الوظائف والخدمات',
              'الأهلية القانونية للعمل أو التوظيف',
              'السلوك داخل المنصة وخارجها'
            ]
          },
          {
            type: 'p',
            text: 'ما لم تُصرّح المنصة صراحةً بتحقق عنصر معين، لا تضمن المنصة صدق البيانات المقدمة من المستخدمين أو أصالتها أو اكتمالها أو حداثتها. ويجب على كل طرف تقييم الطرف الآخر والتحقق منه بشكل مستقل قبل الدخول في أي علاقة.'
          }
        ]
      },
      {
        id: 'types',
        heading: '4. أنواع المستخدمين',
        blocks: [
          {
            type: 'def',
            rows: [
              {
                label: 'العمال (الباحثون عن عمل)',
                desc: 'إنشاء ملفات شخصية ورفع المستندات والتقديم على الوظائف أو العروض.'
              },
              {
                label: 'أصحاب العمل',
                desc: 'نشر الوظائف أو العروض والبحث عن العمال وإدارة التعيينات.'
              },
              {
                label: 'الدعم والإدارة',
                desc: 'مسؤولون في المنصة يشغّلونها ويراجعونها ويحافظون عليها ضمن حدود أدوارهم المأذون بها.'
              }
            ]
          }
        ]
      },
      {
        id: 'relationship',
        heading: '5. علاقة العمل والتوظيف',
        blocks: [
          {
            type: 'p',
            text: 'أي التزامات تتعلق بالعمل أو التوظيف أو الخدمة أو الراتب أو ساعات العمل أو الإجازات أو السكن أو الواجبات أو قواعد العمل أو إنهاء العلاقة أو الضرائب أو التأمين أو التصاريح أو متطلبات الهجرة أو الإقامة، أو أي التزامات قانونية أخرى، تقع في الأساس على مسؤولية العامل وصاحب العمل وفق القانون المعمول به.'
          },
          {
            type: 'p',
            text: 'لا تشرف المنصة على العمل اليومي ولا تتحكم في أداء العامل.'
          },
          {
            type: 'callout',
            title: 'لا تضمن المنصة:',
            items: [
              'استمرار التوظيف',
              'حضور العامل',
              'سلوك صاحب العمل',
              'جودة العمل',
              'دفع الراتب',
              'نجاح العلاقة'
            ]
          }
        ]
      },
      {
        id: 'safety',
        heading: '6. الممتلكات والسلامة وسلوك المستخدمين',
        blocks: [
          {
            type: 'p',
            text: 'إلى الحد الأقصى المسموح به قانونًا، لا تضمن المنصة تعويضًا أو تغطية تأمينية ضد أي خسارة تنشأ عن سلوك المستخدمين نحو بعضهم البعض، سواء داخل المنصة أو خارجها، بما في ذلك على سبيل المثال لا الحصر:'
          },
          {
            type: 'ul',
            items: [
              'السرقة',
              'فقدان الممتلكات',
              'الأضرار التي تلحق بالممتلكات',
              'الإصابات الجسدية',
              'الاعتداء',
              'سوء السلوك',
              'الإهمال',
              'الإخلال باتفاقية',
              'تواري الطرف أو التخلف عن الحضور',
              'أفعال أو امتناعات أخرى من العامل أو صاحب العمل'
            ]
          },
          {
            type: 'p',
            text: 'المنصة ليست ضامنة لسلوك أي من الطرفين، ولا تحد هذه الفقرة من المسؤولية التي لا يجوز تحديدها أو استثناؤها بموجب القانون المعمول به.'
          }
        ]
      },
      {
        id: 'conduct',
        heading: '7. السلوكيات المحظورة',
        blocks: [
          {
            type: 'p',
            text: 'لا يجوز لك استخدام المنصة من أجل:'
          },
          {
            type: 'ul',
            items: [
              'ارتكاب الاحتيال أو تسهيله',
              'انتحال شخصية أي شخص أو جهة، أو تقديم مستندات مزيفة',
              'القيام بأنشطة غير قانونية',
              'مضايقة الآخرين أو تهديدهم أو الإساءة إليهم',
              'نشر محتوى مسيء أو تشهيري أو مضلل',
              'إساءة استخدام البيانات الشخصية للمستخدمين الآخرين',
              'محاولة تجاوز أمن المنصة أو آليات الدفع',
              'ارتكاب احتيال في المدفوعات',
              'الوصول غير المصرح به إلى حساب مستخدم آخر'
            ]
          },
          {
            type: 'p',
            text: 'يجوز للمنصة تعليق الحسابات أو إزالة المحتوى المخالف لهذه الشروط، وتُعالَج البلاغات المتعلقة بالسلوك المشتبه به عبر عملية الشكاوى والدعم في المنصة.'
          }
        ]
      },
      {
        id: 'payments',
        heading: '8. المدفوعات والعمولة',
        blocks: [
          {
            type: 'p',
            text: 'تُفرض على أصحاب العمل عمولة التوظيف السارية بنسبة 15% من المبلغ المعروض (الراتب الشهري المتفق عليه)، كما تظهر لصاحب العمل وقت الدفع. وتتم معالجة الدفع عبر وسائل ومزودي دفع خارجيين متاحين في وقت الدفع، وقد تشمل حاليًا Paymob و PayPal.'
          },
          {
            type: 'p',
            text: 'تظهر العملة المستخدمة في خطوة الدفع قبل تأكيدها وتعتمد المنصة حاليًا بشكل أساسي على الجنيه المصري (EGP). قد تتغير نسب العمولة وهياكل الرسوم بمرور الوقت، وتظهر النسبة السارية قبل تأكيد الدفع.'
          },
          {
            type: 'link',
            text: 'تخضع المدفوعات وعمولات المنصة لسياسة الاسترداد والإلغاء، المتاحة على:',
            href: '/refund-policy',
            label: '/refund-policy'
          }
        ]
      },
      {
        id: 'providers',
        heading: '9. مزودو الدفع الخارجيون',
        blocks: [
          {
            type: 'p',
            text: 'قد تتم معالجة المدفوعات عبر مزودي دفع خارجيين، ولا تقوم المنصة بتخزين بيانات بطاقات الدفع الكاملة ما لم يُذكر ذلك صراحةً.'
          },
          {
            type: 'ul',
            items: [
              'قد يطبق مزودو الدفع شروطهم وأحكامهم الخاصة بهم',
              'قد يجري مزودو الدفع عمليات التحقق وفحوصات الاحتيال الخاصة بهم',
              'قد يطبق مزودو الدفع قواعد وتوقيتات معالجة خاصة بهم'
            ]
          }
        ]
      },
      {
        id: 'termination',
        heading: '10. الإنهاء والتعليق',
        blocks: [
          {
            type: 'p',
            text: 'يجوز للمنصة تعليق الحسابات أو إنهاؤها بسبب مخالفة هذه الشروط أو الاشتباه في الاحتيال أو مخاوف تتعلق بالسلامة أو الأمن أو الأنشطة غير القانونية أو إساءة استخدام المنصة.'
          },
          {
            type: 'p',
            text: 'يظل المستخدمون مسؤولين عن الالتزامات المترتبة قبل التعليق أو الإلغاء.'
          }
        ]
      },
      {
        id: 'disputes',
        heading: '11. النزاعات القانونية',
        blocks: [
          {
            type: 'p',
            text: 'قد تكون النزاعات بين العامل وصاحب العمل مدنية أو جنائية أو عمالية أو مالية أو تعاقدية أو شخصية، ولا تكون المنصة طرفًا تلقائيًا فيها.'
          },
          {
            type: 'callout',
            title: 'إلى الحد الأقصى المسموح به قانونيًا، لا يُطلب من المنصة:',
            items: [
              'الحضور طوعًا في الإجراءات القضائية',
              'تمثيل أي من المستخدمين',
              'دفع التكاليف القانونية',
              'تقديم مساعدة قانونية',
              'العمل كمحكم أو قاضٍ'
            ]
          },
          {
            type: 'p',
            text: 'ومع ذلك، عندما يطلب القانون المعمول به ذلك، أو يصدر أمر أو طلب صحيح من جهة مختصة، تلتزم المنصة بالاستجابة بالتعاون.'
          }
        ]
      },
      {
        id: 'location',
        heading: '12. موقع المستخدم وإيجاد المستخدمين',
        blocks: [
          {
            type: 'p',
            text: 'المنصة ليست خدمة تتبع أو بحث أو تعقب أو إنفاذ للقانون أو تحقيق، ولا تضمن معرفة الموقع الفعلي الحالي لأي مستخدم، ولا تلتزم بتحديد أشخاص أو العثور عليهم أو تتبعهم أو الاتصال بهم لصالح مستخدم آخر.'
          },
          {
            type: 'p',
            text: 'أي معلومات عن الموقع أو العنوان تستند للبيانات المتاحة ولا تضمن المكان الحالي للمستخدم، وتعالج الطلبات القانونية الصحيحة وفق القانون وسياسة الخصوصية.'
          }
        ]
      },
      {
        id: 'disclosure',
        heading: '13. إفشاء البيانات الشخصية',
        blocks: [
          {
            type: 'p',
            text: 'المنصة غير ملزمة بتزويد مستخدم برقم هاتف مستخدم آخر أو عنوانه أو بيانات هويته أو مستنداته أو موقعه أو سجلاته الخاصة أو أي معلومات سرية، لمجرد أن يطلبه أو لوجود نزاع.'
          },
          {
            type: 'p',
            text: 'يخضع إفشاء بيانات المستخدمين لسياسة الخصوصية والقانون المعمول به وللطلبات أو الأوامر القانونية الصحيحة. إذا تبادل المستخدمون بيانات الاتصال طوعًا، لا تتحكم المنصة في الاستخدام المستقل لتلك البيانات خارج الوظائف المقصودة للمنصة، وذلك وفق القانون المعمول به وسياسة الخصوصية وهذه الشروط.'
          }
        ]
      },
      {
        id: 'communication',
        heading: '14. المحادثات والتواصل',
        blocks: [
          {
            type: 'p',
            text: 'قد توفر المنصة أدوات رسائل داخلية، والأقوال والوعود والالتزامات والتفاوضات المتعلقة بالراتب أو العمل أو التمثيلات الشخصية المبادلة بين المستخدمين لا تمثل المنصة ولا تُلزمها، سواء تمت:'
          },
          {
            type: 'def',
            rows: [
              {
                label: 'داخل منصة HomelyServ',
                desc: 'عبر أدوات الرسائل والدردشة الداخلية.'
              },
              {
                label: 'خارج منصة HomelyServ',
                desc: 'عبر واتساب أو الهاتف أو البريد الإلكتروني أو وسائل التواصل أو اللقاءات المباشرة أو أي منصة تواصل خارجية.'
              }
            ]
          },
          {
            type: 'p',
            text: 'لا تضمن المنصة تصدق الأقوال أو الوفاء بالوعود المتبادلة بين المستخدمين.'
          }
        ]
      },
      {
        id: 'review',
        heading: '15. مراجعة الرسائل والوصول إلى المنصة',
        blocks: [
          {
            type: 'p',
            text: 'يجوز للمنصة مراجعة المراسلات المتاحة داخل المنصة عندما يكون ذلك ضروريًا بشكل معقول للسلامة أو منع الاحتيال أو معالجة الشكاوى أو إنفاذ هذه الشروط أو الأمن أو التحقيق في الإساءة أو الامتثال القانوني، مع مراعاة سياسة الخصوصية والقانون المعمول به، ولا تكون المراجعة مستمرة إلا عند الحاجة.'
          },
          {
            type: 'p',
            text: 'المحادثات التي تتم خارج المنصة لا يمكن عمومًا للمنصة مراقبتها أو التحقق منها أو استردادها أو ضمانها.'
          }
        ]
      },
      {
        id: 'complaints',
        heading: '16. نظام الشكاوى والدعم',
        blocks: [
          {
            type: 'p',
            text: 'قد توفر المنصة آليات للشكاوى والدعم تشمل معالجة الشكاوى ومراجعة الحسابات وتعليقها والتحقيق الداخلي والمساعدة الإدارية ومراسلات الدعم.'
          },
          {
            type: 'p',
            text: 'تقديم هذه الخدمات لا يجعل المنصة صاحب عمل أو ضامنًا أو محكمة أو محكمًا أو طرفًا في النزاع الأساسي، وقد تتخذ المنصة إجراءات تتعلق بالحسابات وفق سياساتها.'
          }
        ]
      },
      {
        id: 'limitation',
        heading: '17. الحد من المسؤولية',
        blocks: [
          {
            type: 'p',
            text: 'إلى الحد الأقصى المسموح به قانونيًا، لا تكون المنصة مسؤولة عن:',
          },
          {
            type: 'ul',
            items: [
              'سلوك المستخدمين أو الخسائر الناتجة عنه، بما في ذلك أي خسارة ناتجة عما مذكور في القسم السادس',
              'المحتوى أو المعلومات المقدمة من المستخدمين',
              'نزاعات العمل أو الخدمة بين المستخدمين',
              'التواصل الذي يتم خارج المنصة',
              'الوعود أو الالتزامات المتبادلة بين المستخدمين',
              'الخسائر الناتجة عن سلوك أطراف أخرى'
            ]
          },
          {
            type: 'p',
            text: 'لا تُقصي هذه الشروط أو تحد من المسؤولية التي يستحيل قانونًا استثناها أو تقييدها.'
          }
        ]
      },
      {
        id: 'law',
        heading: '18. القانون الواجب التطبيق',
        blocks: [
          {
            type: 'p',
            text: 'تخضع هذه الشروط للقوانين المعمول بها ذات الصلة بالمنصة والعلاقة أو العملية، مع مراعاة قوانين المستهلكين والتوظيف والخصوصية وغيرها من القوانين الإلزامية التي لا يمكن استبعادها.'
          }
        ]
      },
      {
        id: 'changes',
        heading: '19. التعديلات على هذه الشروط',
        blocks: [
          {
            type: 'p',
            text: 'يجوز للمنصة تحديث هذه الشروط من وقت لآخر، ويتم الإعلان عن التغييرات الجوهرية حيثما أمكن ذلك، وقد يشكل استمرار الاستخدام بعد ذلك قبول لها حيث يسمح القانون.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '20. التواصل',
        blocks: [
          {
            type: 'p',
            text: 'إذا كانت لديك أسئلة حول هذه الشروط، تواصل معنا على البريد support@homelyserv.com أو عبر الهاتف +20 100 918 9851 أو عبر صفحة «اتصل بنا». تعمل المنصة من القاهرة، مصر.'
          }
        ]
      }
    ],
    notice:
      'هذه وثائق سياسات قانونية أولية (مسودات) وينبغي مراجعتها من قبل مستشار قانوني مؤهل قبل الإطلاق التجاري الكبير.'
  }
};

const Terms = () => <LegalDocument content={CONTENT} />;

export default Terms;