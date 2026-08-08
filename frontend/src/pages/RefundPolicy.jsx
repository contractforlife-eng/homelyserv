// src/pages/RefundPolicy.jsx
// Refund & Cancellation Policy — English + Arabic, public route /refund-policy.
// Reflects the CURRENT real platform behavior: commission is generally non-refundable.
// Draft legal copy; review by qualified legal counsel recommended.
import React from 'react';
import LegalDocument from '../components/common/LegalDocument';

const CONTENT = {
  en: {
    title: 'Refund & Cancellation Policy',
    back: 'Back',
    lastUpdated: 'Last updated: June 27, 2026',
    subtitle:
      'This policy explains when HomelyServ platform fees and commissions may or may not be refunded, and how offers and hires may be cancelled or terminated. It reflects the way the platform currently operates.',
    sections: [
      {
        id: 'scope',
        heading: '1. What This Policy Covers',
        blocks: [
          {
            type: 'p',
            text: 'This policy covers payments made to HomelyServ, primarily the platform recruitment commission charged to Employers when they pay to connect with a Worker. It does not cover salaries or other amounts agreed directly between a Worker and an Employer, which are handled between those parties.'
          }
        ]
      },
      {
        id: 'nonrefundable',
        heading: '2. Platform Commission is Generally Non-Refundable',
        blocks: [
          {
            type: 'p',
            text: 'The platform commission is generally non-refundable once the payment succeeds and the paid platform service has been delivered, including where the relevant connection, contact-access, or hire-related service has been completed.'
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
            title: 'The following do not, by themselves, create a right to a refund of the platform commission:',
            items: [
              'termination of the relationship between the Worker and the Employer',
              'disagreement between the parties',
              'dissatisfaction with the Worker or the Employer',
              'missed attendance or performance issues',
              'a personal dispute between the parties',
              'a change of mind'
            ]
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
        heading: '6. Refund Process',
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
              'If a refund is approved through a third-party provider, that provider’s processing timelines apply.'
            ]
          }
        ]
      },
      {
        id: 'providers',
        heading: '7. Third-Party Payment Providers',
        blocks: [
          {
            type: 'p',
            text: 'Payments are processed by third-party providers. Their terms, verification rules, fraud checks, and processing timelines apply to any refund carried out through them. HomelyServ cannot reverse a card or wallet charge directly through its own systems.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '8. Contact',
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
    lastUpdated: 'آخر تحديث: 27 يونيو 2026',
    subtitle:
      'توضح هذه السياسة متى يجوز أو لا يجوز استرداد رسوم المنصة وعمولاتها، وكيف يمكن إلغاء العروض أو إنهاء التعيينات. وهي تعكس طريقة عمل المنصة الحالية.',
    sections: [
      {
        id: 'scope',
        heading: '1. نطاق هذه السياسة',
        blocks: [
          {
            type: 'p',
            text: 'تنطبق هذه السياسة على المدفوعات المقدمة إلى المنصة، وفي المقام الأول عمولة التوظيف التي يدفعها صاحب العمل عند التواصل مع أحد العمال. ولا تشمل الرواتب أو المبالغ الأخرى المتفق عليها مباشرة بين العامل وصاحب العمل، والتي تُدار وتُنفذ بين الطرفين مباشرة.'
          }
        ]
      },
      {
        id: 'nonrefundable',
        heading: '2. عمولة المنصة غير قابلة للاسترداد بشكل عام',
        blocks: [
          {
            type: 'p',
            text: 'عمولة المنصة غير قابلة للاسترداد بشكل عام بمجرد نجاح الدفع واكتمال الخدمة المدفوعة المطلوبة، بما في ذلك حالات إتمام خدمة التعيين أو الوصول إلى بيانات التواصل أو الخدمات المرتبطة بالتوظيف.'
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
              'المصروفات المكررة أو الخصم المكرر',
              'خطأ تقني مؤكد في المعالجة المالية',
              'خصم ناجح لم تُقدّم فيه الخدمة المدفوعة بسبب خلل مؤكد من المنصة',
              'عملية غير مصرح بها، وفق التحقيق وقواعد مزود الدفع',
              'أي استرداد يوجبه القانون المعمول به'
            ]
          },
          {
            type: 'p',
            text: 'قد يتطلّب الاسترداد إجراء تحقيق، وقد يُطلب منك تقديم تفاصيل إضافية. لا يوجد استرداد تلقائي أو بدون شروط.'
          }
        ]
      },
      {
        id: 'nogrounds',
        heading: '4. ما لا يُنشئ حقًا في الاسترداد',
        blocks: [
          {
            type: 'callout',
            title: 'لا تُشكّل الحالات التالية بحد ذاتها حقًا في استرداد عمولة المنصة:',
            items: [
              'إنهاء العلاقة بين العامل وصاحب العمل',
              'الخلاف بين الطرفين',
              'عدم الرضا عن العامل أو صاحب العمل',
              'تخلف عن الحضور أو مشكلات الأداء',
              'نزاع شخصي بين الطرفين',
              'تغيير الرأي'
            ]
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
        heading: '6. إجراءات الاسترداد',
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
              'إذا تمت الموافقة على الاسترداد عبر مزود دفع خارجي، تسري توقيتات معالجته.'
            ]
          }
        ]
      },
      {
        id: 'providers',
        heading: '7. مزودو الدفع الخارجيون',
        blocks: [
          {
            type: 'p',
            text: 'تتم معالجة المدفوعات عبر مزودي دفع خارجيين، وتنطبق شروطهم وقواعدهم وفحوصاتهم وتوقيتاتهم على أي استرداد يُنفذ عبر أنظمتهم، ولا تستطيع المنصة إرجاع مبلغ بطاقة أو محفظة مباشرة عبر أنظمتها الخاصة.'
          }
        ]
      },
      {
        id: 'contact',
        heading: '8. التواصل',
        blocks: [
          {
            type: 'p',
            text: 'للاستفسارات المتعلقة بالاسترداد أو الفوترة، تواصل معنا على البريد الإلكتروني support@homelyserv.com أو على الهاتف +20 100 918 9851 أو عبر صفحة «اتصل بنا». تعمل المنصة من القاهرة في مصر.'
          }
        ]
      }
    ],
    notice:
      'هذه السياسة مسودة قانونية أولية ويجب مراجعتها من مستشار قانوني مؤهل قبل الإطلاق التجاري الكبير، وهي تصف سلوك المنصة الحالي ولا تُنشئ أي استحقاق استرداد تلقائي أو غير مشروط.'
  }
};

const RefundPolicy = () => <LegalDocument content={CONTENT} />;

export default RefundPolicy;