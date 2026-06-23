const express = require('express');
const router = express.Router();
const axios = require('axios');

// مسار إنشاء عملية دفع جديدة لعمولة HomelyServ
router.post('/paymob/checkout', async (req, res) => {
  try {
    const { amount, userEmail, userFirstName, userLastName, userPhone } = req.body;

    // 1. طلب الـ Authentication Token من Paymob
    const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: process.env.PAYMOB_API_KEY
    });
    const authToken = authResponse.data.token;

    // 2. تسجيل الطلب (Order Registration)
    // حساب القيمة بالقرش (المبلغ * 100) لتشمل العمولة والـ VAT (حوالي 7.41%)
    const amountInCents = Math.round(amount * 100); 

    const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amountInCents,
      currency: "EGP",
      items: []
    });
    const orderId = orderResponse.data.id;

    // 3. توليد مفتاح الدفع (Payment Key)
    const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: amountInCents,
      expiration: 3600, // ساعة واحدة صلاحية الرابط
      order_id: orderId,
      billing_data: {
        first_name: userFirstName || "Employer",
        last_name: userLastName || "User",
        email: userEmail || "clented@homelyserv.com",
        phone_number: userPhone || "01000000000",
        floor: "NA", apartment: "NA", street: "NA", building: "NA", 
        shipping_method: "NA", postal_code: "NA", city: "Cairo", country: "EG", state: "Cairo"
      },
      currency: "EGP",
      integration_id: parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID)
    });

    // إرجاع الـ Token للفرونت إند لفتح نافذة الدفع
    return res.status(200).json({ 
      success: true, 
      paymentToken: paymentKeyResponse.data.token 
    });

  } catch (error) {
    console.error("Paymob Error:", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, error: "فشلت عملية الاتصال ببوابة الدفع" });
  }
});

module.exports = router;