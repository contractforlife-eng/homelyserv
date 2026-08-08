// src/pages/RefundPolicy.jsx
// Refund & Cancellation Policy — English + Arabic, public route /refund-policy.
// Draft legal copy; review by qualified legal counsel recommended before major commercial launch.
import React from 'react';
import LegalDocument from '../components/common/LegalDocument';

const CONTENT = {
  en: {
    title: 'Refund & Cancellation Policy',
    back: 'Back',
    lastUpdated: 'Last updated: August 8, 2026',
    subtitle:
      'This policy explains when HomelyServ platform fees and commissions may or may not be refunded, and how offers and hires may be cancelled or terminated.',
    sections: [
      {
        id: 'scope',
        heading: '1. What This Policy Covers',
        blocks: [
          {
            type: 'p',
            text: 'This policy covers payments made to HomelyServ, primarily the applicable platform recruitment commission shown at checkout when an Employer pays to connect with a Worker or use associated paid platform services. It does not cover salaries or other amounts agreed directly between a Worker and an Employer, which are handled between those parties.'
          }
        ]
      },
      {
        id: 'nonrefundable',
        heading: '2. Platform Commission is Generally Non-Refundable',
        blocks: [
          {
            type: 'p',
            text: 'The applicable platform commission is generally non-refundable once the payment succeeds and the paid platform service has been delivered, including where the relevant connection, contact-access, or hire-related service has been completed.'
          }
        ]
      },
      {
        id: 'review',
        heading: '3. When a Review MAY Be Considered',
        blocks: [
          {
            type: 'p',
            text: 'A refund or reimbursement review MAY be considered for:'
          },
          {
            type: 'ul',
            items: [
              'a duplicate charge',
              'a confirmed technical payment error',
              'a successful charge where the paid platform service was not delivered due to a verified platform failure',
              'an unauthorized transaction, subject to investigation and the rules of the payment provider',
              'any refund required by applicable law'
            ]
          },
          {
            type: 'p',
            text: 'Refund eligibility may require investigation, and supporting details may be requested. No automatic or unconditional refund is guaranteed.'
          }
        ]
      },
      {
        id: 'nogrounds',
        heading: '4. What Does NOT Create a Right to a Refund',
        blocks: [
          {
            type: 'callout',
            title: 'The following do not, by themselves, create an automatic right to a refund after the paid HomelyServ platform service has been delivered:',
            items: [
              'misconduct by a Worker or an Employer',
              'disappearance or loss of contact',
              'breach of a user-to-user agreement',
              'failure to attend',
              'refusal or failure to continue the relationship',
              'termination of the relationship between the Worker and the Employer',
              'disagreement about salary or work conditions',
              'dissatisfaction with another user',
              'a change of mind'
            ]
          },
          {
            type: 'p',
            text: 'This is always subject to any mandatory rights under applicable law and to the verified platform-failure exceptions described in this policy.'
          }
        ]
      },
      {
        id: 'cancellation',
        heading: '5. Cancellation and Termination',
        blocks: [
          {
            type: 'p',
            text: 'Offers may be rejected before they are completed according to the existing platform flow. A hire may later be terminated using the functionality available in the platform.'
          },
          {
            type: 'p',
            text: 'Termination of the Worker/Employer relationship does not automatically cancel or refund a completed platform commission.'
          }
        ]
      },
      {
        id: 'process',
        heading: '6. Refund Process and Original Payment Method',
        blocks: [
          {
            type: 'p',
            text: 'To request a review of a payment, contact us through our Contact page with your transaction details. Requests are handled on a case-by-case basis.'
          },
          {
            type: 'ul',
            items: [
              'An investigation may be required before a decision is made.',
              'Refund decisions are made within the limits allowed by the payment provider and applicable law.',
              'Where approved, a refund may be processed through the original payment provider, and that provider’s processing timelines apply.'
            ]
          },
          {
            type: 'p',
            text: 'Where technically and legally possible, an approved refund will be returned to the original payment method used for the transaction. HomelyServ does not promise a refund to an alternative account or card unless required or approved through the relevant provider.'
          }
        ]
      },
      {
        id: 'providers',
        heading: '7. Third-Party Payment Providers',
        blocks: [
          {
            type: 'p',
            text: 'Payments are processed by third-party payment providers. Their terms, verification rules, fraud checks, and processing timelines apply to any refund carried out through them. Approved refunds, where applicable, may be processed through the original payment provider and remain subject to that provider’s procedures and processing timelines.'
          }
        ]
      },
      {
        id: 'chargebacks',
        heading: '8. Chargebacks and Payment Disputes',
        blocks: [
          {
            type: 'p',
            text: 'If a user disputes a payment through a card issuer, PayPal, another payment provider, or a bank, HomelyServ may:'
          },
          {
            type: 'ul',
            items: [
              'provide available transaction records to the payment provider',
              'request supporting information from the user',
              'temporarily review the related transaction or service',
              'cooperate with legitimate fraud or security investigations'
            ]
          },
          {
            type: 'p',
            text: 'Opening a chargeback or payment dispute does not automatically result in account termination. Where a payment-provider or legal process applies, that process will govern the final outcome, along with applicable law.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '9. Contact',
        blocks: [
          {
            type: 'p',
            text: 'For refund or billing questions, contact us at support@homelyserv.com, call +20 100 918 9851, or visit our Contact page. HomelyServ operates from Cairo, Egypt.'
          }
        ]
      }
    ],
    notice:
      'This policy is a product/legal draft and should be reviewed by qualified legal counsel before major commercial launch. It describes current platform behavior and does not establish any automatic or unconditional refund entitlement.'
  },

  ar: {
    title: 'سياسة الاسترداد والإلغاء',
    back: 'رجوع',
    lastUpdated: 'آخر تحديث: 8 أغسطس 2026',
    subtitle:
      'توضح هذه السياسة متى يجوز أو لا يجوز استرداد رسوم المنصة وعمولاتها، وكيف يمكن إلغاء العروض أو إنهاء التعيينات.',
    sections: [
      {
        id: 'scope',
        heading: '1. نطاق هذه السياسة',
        blocks: [
          {
            type: 'p',
            text: 'تنطبق هذه السياسة على المدفوعات المقدمة إلى المنصة، وفي المقام الأول على عمولة التوظيف السارية والموضحة عند إتمام الشراء عندما يدفع صاحب العمل للتواصل مع عامل أو للاستفادة من الخدمات المدفوعة المرتبطة بالمنصة، ولا تشمل الرواتب أو المبالغ الأخرى المتفق عليها مباشرة بين العامل وصاحب العمل، والتي تُدار بين الطرفين.'
          }
        ]
      },
      {
        id: 'nonrefundable',
        heading: '2. عمولة المنصة غير قابلة للاسترداد بشكل عام',
        blocks: [
          {
            type: 'p',
            text: 'عمولة المنصة السارية غير قابلة للاسترداد بشكل عام بمجرد نجاح الدفع واكتمال الخدمة المدفوعة المطلوبة، بما في ذلك حالات إتمام خدمة التعيين أو الوصول إلى بيانات التواصل أو الخدمات المرتبطة بالتوظيف.'
          }
        ]
      },
      {
        id: 'review',
        heading: '3. متى قد يُنظر في الاسترداد',
        blocks: [
          {
            type: 'p',
            text: 'قد يُنظر في مراجعة الاسترداد أو التسوية في الحالات التالية:'
          },
          {
            type: 'ul',
            items: [
              'الخصم المكرر',
              'خطأ تقني مؤكد في المعالجة المالية',
              'خصم ناجح لم تُقدَّم فيه الخدمة المدفوعة بسبب خلل مؤكد من المنصة',
              'عملية غير مصرح بها، وفق التحقيق وقواعد مزود الدفع',
              'أي استرداد يوجبه القانون المعمول به'
            ]
          },
          {
            type: 'p',
            text: 'قد يتطلّب الاسترداد إجراء تحقيق، وقد يُطلب منك تقديم تفاصيل إضافية، ولا يوجد استرداد تلقائي أو دون شروط.'
          }
        ]
      },
      {
        id: 'nogrounds',
        heading: '4. ما لا يُنشئ حقًا في الاسترداد',
        blocks: [
          {
            type: 'callout',
            title: 'لا تُشكّل الحالات التالية بحد ذاتها حقًا تلقائيًا في استرداد العمولة بعد اكتمال الخدمة المدفوعة من المنصة:',
            items: [
              'سلوك يُعدّ سوء تصرف من العامل أو صاحب العمل',
              'تواري الطرف أو فقدان التواصل معه',
              'الإخلال باتفاقية بين المستخدمين',
              'التخلف عن الحضور',
              'رفض الاستمرار في العلاقة أو التوقف عنها',
              'إنهاء العلاقة بين العامل وصاحب العمل',
              'الخلاف بشأن الراتب أو ظروف العمل',
              'عدم الرضا عن مستخدم آخر',
              'تغيير الرأي'
            ]
          },
          {
            type: 'p',
            text: 'يظل ذلك خاضعًا دائمًا لحقوق القانون الإلزامية المعمول بها، وللظروف الموثقة المرتبطة بخلل من المنصة والموصوفة في هذه السياسة.'
          }
        ]
      },
      {
        id: 'cancellation',
        heading: '5. الإلغاء والإنهاء',
        blocks: [
          {
            type: 'p',
            text: 'يمكن رفض العروض قبل إتمامها وفق مسار المنصة الحالي، ويمكن لاحقًا إنهاء التعيين باستخدام الوظائف المتاحة في المنصة.'
          },
          {
            type: 'p',
            text: 'إنهاء العلاقة بين العامل وصاحب العمل لا يُلغي تلقائيًا ولا يسترد عمولة منصة قد اكتملت.'
          }
        ]
      },
      {
        id: 'process',
        heading: '6. إجراءات الاسترداد وطريقة الدفع الأصلية',
        blocks: [
          {
            type: 'p',
            text: 'لطلب مراجعة عملية دفع، تواصل معنا عبر صفحة «اتصل بنا» مع تفاصيل معاملتك، وتُعالج الطلبات كل حالة على حدة.'
          },
          {
            type: 'ul',
            items: [
              'قد يلزم إجراء تحقيق قبل إصدار القرار.',
              'تُتخذ قرارات الاسترداد وفق ما تسمح به قواعد مزود الدفع والقانون المعمول به.',
              'حيثما تقرر الاسترداد، قد تتم عملية إعادته عبر مزود الدفع الأصلي، وتسري توقيتات معالجته.'
            ]
          },
          {
            type: 'p',
            text: 'عندما يكون ذلك ممكنًا من الناحية الفنية والقانونية، يُعاد الاسترداد المعتمد إلى طريقة الدفع الأصلية المستخدمة للمعاملة، ولا تَعِد المنصة بالاسترداد إلى حساب أو بطاقة بديلة إلا إذا لزم ذلك أو اعتمده المزود المعني.'
          }
        ]
      },
      {
        id: 'providers',
        heading: '7. مزودو الدفع الخارجيون',
        blocks: [
          {
            type: 'p',
            text: 'تتم معالجة المدفوعات عبر مزودي دفع خارجيين، وتنطبق شروطهم وقواعد التحقق وفحوصات الاحتيال وتوقيتات المعالجة على أي استرداد يتم عبرهم، وتُعالَج الاستردادات المعتمدة حيثما أمكن عبر مزود الدفع الأصلي ووفق إجراءاته وتوقيتاته.'
          }
        ]
      },
      {
        id: 'chargebacks',
        heading: '8. النزاعات المالية والاعتراضات على الدفع',
        blocks: [
          {
            type: 'p',
            text: 'إذا اعترض المستخدم على عملية دفع عبر مصدر البطاقة أو باي بال أو أي مزود دفع آخر أو بنك، يجوز للمنصة:'
          },
          {
            type: 'ul',
            items: [
              'تزويد مزود الدفع بسجلات المعاملة المتاحة',
              'طلب معلومات داعمة من المستخدم',
              'مراجعة المعاملة أو الخدمة ذات الصلة بشكل مؤقت',
              'التعاون مع تحقيقات الاحتيال أو الأمن المشروعة'
            ]
          },
          {
            type: 'p',
            text: 'لا يؤدي فتح نزاع أو اعتراضي دفع تلقائيًا إلى إنهاء الحساب، وحيث تطبق إجراءات مزود الدفع أو القانون، تحكم تلك الإجراءات النتيجة النهائية.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '9. التواصل',
        blocks: [
          {
            type: 'p',
            text: 'للاستفسارات المتعلقة بالاسترداد أو الفوترة، تواصل معنا على البريد الإلكتروني support@homelyserv.com أو عبر الهاتف +20 100 918 9851 أو عبر صفحة «اتصل بنا». تعمل المنصة من القاهرة، مصر.'
          }
        ]
      }
    ],
    notice:
      'هذه السياسة مسودة قانونية أولية ويجب مراجعتها من قبل مستشار قانوني مؤهل قبل الإطلاق التجاري الكبير، وهي تصف سلوك المنصة الحالي ولا تُنشئ أي استحقاق استرداد تلقائي أو دون شروط.'
  }
};

const RefundPolicy = () => <LegalDocument content={CONTENT} />;

export default RefundPolicy;