import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
export const getWorkerPayments = async (req, res) => {
  try {
    // نفترض أن الـ Middleware قام بوضع بيانات المستخدم في req.user
    const userId = req.user.id; 

    const payments = await prisma.payment.findMany({
      where: {
        userId: userId, // مطابقة لـ userId الموجود في المخطط الخاص بك
        type: 'HIRE'    // لجلب مدفوعات التوظيف فقط
      },
      orderBy: {
        date: 'desc'    // مطابقة لاسم الحقل 'date' في المخطط الخاص بك
      },
      include: {
        hire: true      // اختيارياً: لجلب تفاصيل عملية التوظيف المرتبطة
      }
    });

    res.json({
      success: true,
      payments: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};