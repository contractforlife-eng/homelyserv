import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Browser } from '@capacitor/browser'; // استدعاء المتصفح الداخلي للموبايل

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hire, setHire] = useState(null);
  const [method, setMethod] = useState('paymob'); // جعل Paymob الخيار الافتراضي الأول
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [receiptFile, setReceiptFile] = useState(null);

  // ⚠️ يرجى كتابة الـ Iframe ID الخاص بك من حساب بايموب هنا
  const PAYMOB_IFRAME_ID = "اكتب_هنا_رقم_الـ_Iframe_الخاص_بك"; 
  const BACKEND_API = "https://gas-clapped-copper.ngrok-free.dev"; // رابط الـ ngrok الحالي

  useEffect(() => {
    api.get('/hires/my').then(res => {
      const found = res.data.find(h => h.id === id);
      setHire(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // منطق الدفع التلقائي عبر بايموب
  const handlePaymobPayment = async () => {
    setSubmitting(true);
    try {
      // استدعاء الـ API الذي أنشأناه في الباك إند
      const response = await api.post('/paymob/checkout', {
        amount: hire.totalDue,
        userFirstName: hire.employer?.user?.fullName || "Employer",
        userLastName: "User",
        userEmail: hire.employer?.user?.email || "employer@homelyserv.com",
        userPhone: hire.employer?.user?.phone || "01000000000"
      });

      if (response.data.success) {
        const token = response.data.paymentToken;

        // فتح صفحة الدفع بالفيزا داخل التطبيق مباشرة
        await Browser.open({ 
          url: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${token}` 
        });

        // عند عودة المستخدم للتطبيق بعد الدفع
        Browser.addListener('browserFinished', () => {
          setStep(3); // الانتقال لصفحة النجاح والانتظار التلقائي
          toast.success('Returned to app successfully!');
        });
      }
    } catch (err) {
      toast.error('Failed to initiate card payment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!receiptFile) {
      toast.error('Please upload your payment screenshot first');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethod', method);
      formData.append('receipt', receiptFile);
      await api.put(`/hires/${id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStep(3);
      toast.success('Payment submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment');
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success(`${label} copied!`);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>;
  if (!hire) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Hire not found</div>;

  // إضافة خيار الدفع الإلكتروني بالفيزا في مصفوفة طرق الدفع
  const paymentMethods = [
    { id: 'paymob', label: 'Credit / Debit Card (Paymob)', desc: 'Pay instantly via Visa, Mastercard or Meeza', color: '#C0392B', short: '💳' },
    { id: 'instapay', label: 'InstaPay', desc: 'Transfer via any Egyptian bank app', color: '#1A3C8F', short: 'IP' },
    { id: 'vodafone', label: 'Vodafone Cash', desc: 'Pay from your Vodafone wallet', color: '#E2001A', short: 'VC' },
    { id: 'bank', label: 'Bank Transfer', desc: 'QNB Al Ahli · IBAN supported', color: '#1A6B3C', short: 'BK' },
    { id: 'btc', label: 'Bitcoin (BTC)', desc: 'Pay with Bitcoin on Bitcoin network', color: '#F7931A', short: '₿' },
    { id: 'usdc', label: 'USDC (Solana)', desc: 'Pay with USDC on Solana network', color: '#2775CA', short: '$' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Pay Commission</h1>
        <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', fontSize: '12px', color: '#fff', padding: '3px 12px', borderRadius: '20px' }}>
          Step {step} of 3
        </div>
      </div>

      {/* STEP 1 - Choose method */}
      {step === 1 && (
        <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
          {/* Summary */}
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#F5F5F5', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '3px' }}>Hiring summary</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>{hire.worker?.user?.fullName}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{hire.worker?.category}</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Agreed salary</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>EGP {hire.agreedSalary?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Commission (6.5%)</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>EGP {hire.commissionAmount?.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>VAT (14%)</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>EGP {hire.vatAmount?.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Total due</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#C0392B' }}>EGP {hire.totalDue?.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '8px', letterSpacing: '0.4px' }}>SELECT PAYMENT METHOD</div>

          {/* Egyptian methods */}
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: '500' }}>🇪🇬 Egyptian payments</div>
          {paymentMethods.slice(0, 4).map(m => (
            <div key={m.id} onClick={() => setMethod(m.id)}
              style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: method === m.id ? '1.5px solid #C0392B' : '1.5px solid #E0E0E0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px', flexShrink: 0 }}>
                {m.short}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1A1A' }}>{m.label}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{m.desc}</div>
              </div>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: method === m.id ? '2px solid #C0392B' : '2px solid #E0E0E0', background: method === m.id ? '#C0392B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {method === m.id && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          ))}

          {/* Crypto methods */}
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: '500', marginTop: '8px' }}>🌍 International crypto payments</div>
          {paymentMethods.slice(4).map(m => (
            <div key={m.id} onClick={() => setMethod(m.id)}
              style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: method === m.id ? '1.5px solid #C0392B' : '1.5px solid #E0E0E0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px', flexShrink: 0 }}>
                {m.short}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1A1A' }}>{m.label}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{m.desc}</div>
              </div>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: method === m.id ? '2px solid #C0392B' : '2px solid #E0E0E0', background: method === m.id ? '#C0392B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {method === m.id && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          ))}

          <div style={{ fontSize: '12px', color: '#888', padding: '4px 0 16px' }}>
            🔒 Payment verified securely by HomelyServ system
          </div>

          {/* زر المتابعة التكيفي: لو اختار بايموب يدفع فوراً، ولو اختار طريقة يدوية ينتقل لخطوة رفع الإيصال */}
          <button 
            onClick={() => method === 'paymob' ? handlePaymobPayment() : setStep(2)}
            disabled={submitting}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
          >
            {submitting ? 'Processing Payment...' : method === 'paymob' ? 'Pay Now via Card' : 'Proceed to payment instructions'}
          </button>
        </div>
      )}

      {/* STEP 2 - Instructions (تفتح فقط في حالة اختيار الطرق اليدوية القديمة) */}
      {step === 2 && (
        <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
          <div style={{ background: method === 'vodafone' ? '#E2001A' : method === 'bank' ? '#1A6B3C' : method === 'btc' ? '#F7931A' : method === 'usdc' ? '#2775CA' : '#1A3C8F', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px', color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Amount to transfer</div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>EGP {hire.totalDue?.toFixed(0)}</div>
            <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
              {(method === 'btc' || method === 'usdc') ? 'Send equivalent amount in crypto' : `Commission · ${hire.worker?.user?.fullName}`}
            </div>
          </div>

          {/* InstaPay */}
          {method === 'instapay' && (
            <>
              {[
                { n: 1, title: 'Open your bank app', body: 'Open the InstaPay section in your bank app (CIB, Banque Misr, NBE, QNB, or any participating bank).' },
                { n: 2, title: 'Send to this number', number: '01009189851' },
                { n: 3, title: 'Add reference code', ref: hire.paymentReference },
                { n: 4, title: `Transfer exactly EGP ${hire.totalDue?.toFixed(0)}`, body: 'Send the exact amount. Partial payments are not accepted.' }
              ].map(s => (
                <div key={s.n} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#C0392B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.n}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{s.title}</div>
                  </div>
                  {s.body && <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>{s.body}</div>}
                  {s.number && (
                    <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>HomelyServ recipient number</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '1px' }}>{s.number}</div>
                      <button onClick={() => copyToClipboard(s.number, 'Number')} style={{ marginTop: '8px', fontSize: '12px', color: '#C0392B', fontWeight: '500', cursor: 'pointer', border: '1px solid #C0392B', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                        📋 Copy number
                      </button>
                    </div>
                  )}
                  {s.ref && (
                    <div style={{ background: '#FDECEA', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{s.ref}</div>
                      <button onClick={() => copyToClipboard(s.ref, 'Reference')} style={{ marginTop: '8px', fontSize: '12px', color: '#C0392B', fontWeight: '500', cursor: 'pointer', border: '1px solid #C0392B', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                        📋 Copy reference
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Vodafone Cash */}
          {method === 'vodafone' && (
            <>
              {[
                { n: 1, title: 'Open Vodafone Cash', body: 'Dial *9# from your Vodafone number or open My Vodafone app → Send Money.' },
                { n: 2, title: 'Send to this number', number: '01009189851' },
                { n: 3, title: 'Add reference code', ref: hire.paymentReference },
                { n: 4, title: `Transfer exactly EGP ${hire.totalDue?.toFixed(0)}`, body: 'Enter your Vodafone Cash PIN to complete.' }
              ].map(s => (
                <div key={s.n} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E2001A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.n}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{s.title}</div>
                  </div>
                  {s.body && <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>{s.body}</div>}
                  {s.number && (
                    <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>HomelyServ wallet number</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '1px' }}>{s.number}</div>
                      <button onClick={() => copyToClipboard(s.number, 'Number')} style={{ marginTop: '8px', fontSize: '12px', color: '#C0392B', fontWeight: '500', cursor: 'pointer', border: '1px solid #C0392B', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                        📋 Copy number
                      </button>
                    </div>
                  )}
                  {s.ref && (
                    <div style={{ background: '#FDE8EA', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#E2001A', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2001A', letterSpacing: '2px' }}>{s.ref}</div>
                      <button onClick={() => copyToClipboard(s.ref, 'Reference')} style={{ marginTop: '8px', fontSize: '12px', color: '#E2001A', fontWeight: '500', cursor: 'pointer', border: '1px solid #E2001A', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                        📋 Copy reference
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Bank Transfer */}
          {method === 'bank' && (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>Bank account details</div>
                {[
                  { label: 'Bank name', value: 'QNB Al Ahli' },
                  { label: 'Account name', value: 'HomelyServ Payments' },
                  { label: 'Account number', value: '1002425938683' },
                  { label: 'IBAN', value: 'EG580037000908181002425938683' },
                  { label: 'Swift / BIC', value: 'QNBAEGCXXXX' },
                  { label: 'Currency', value: 'Egyptian Pound (EGP)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A1A', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{row.value}</span>
                      <button onClick={() => copyToClipboard(row.value, row.label)} style={{ fontSize: '10px', color: '#C0392B', cursor: 'pointer', border: 'none', background: 'none', padding: '2px' }}>📋</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FDECEA', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <button onClick={() => copyToClipboard(hire.paymentReference, 'Reference')} style={{ marginTop: '8px', fontSize: '12px', color: '#C0392B', fontWeight: '500', cursor: 'pointer', border: '1px solid #C0392B', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                  📋 Copy reference
                </button>
              </div>
            </>
          )}

          {/* Bitcoin */}
          {method === 'btc' && (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F7931A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>1</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>Open your Bitcoin wallet</div>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>Open any Bitcoin wallet app (Trust Wallet, Coinbase, Binance, etc.) and go to Send.</div>
              </div>

              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F7931A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>2</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>Send BTC to this address</div>
                </div>
                <div style={{ background: '#FFF8F0', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#F7931A', fontWeight: '600', marginBottom: '6px' }}>₿ Bitcoin Address (BTC Network)</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1A1A1A', wordBreak: 'break-all', letterSpacing: '0.5px', lineHeight: '1.6' }}>
                    bc1qvgm3ypfv9zhzgp7wxet5ap4uxmxs3jetnaghdt6mfqeez0kfzhqs3uerph
                  </div>
                  <button onClick={() => copyToClipboard('bc1qvgm3ypfv9zhzgp7wxet5ap4uxmxs3jetnaghdt6mfqeez0kfzhqs3uerph', 'BTC Address')}
                    style={{ marginTop: '8px', fontSize: '12px', color: '#F7931A', fontWeight: '500', cursor: 'pointer', border: '1px solid #F7931A', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                    📋 Copy BTC address
                  </button>
                </div>
              </div>

              <div style={{ background: '#FFF8F0', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#F7931A', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#F7931A', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Include this in the memo/note field of your transfer</div>
              </div>

              <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#7D6608' }}>
                ⚠️ Make sure to send on the <strong>BITCOIN network only</strong>. Sending on wrong network will result in loss of funds.
              </div>
            </>
          )}

          {/* USDC Solana */}
          {method === 'usdc' && (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2775CA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>1</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>Open your Solana wallet</div>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>Open any Solana wallet (Phantom, Trust Wallet, Coinbase, etc.) and go to Send USDC.</div>
              </div>

              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2775CA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>2</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>Send USDC to this address</div>
                </div>
                <div style={{ background: '#EEF4FF', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#2775CA', fontWeight: '600', marginBottom: '6px' }}>💵 USDC Address (Solana Network)</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1A1A1A', wordBreak: 'break-all', letterSpacing: '0.5px', lineHeight: '1.6' }}>
                    6vRak8Jumw2QjgMKJCnvZxYxKW4hPvUceBGM5Zxqq4or
                  </div>
                  <button onClick={() => copyToClipboard('6vRak8Jumw2QjgMKJCnvZxYxKW4hPvUceBGM5Zxqq4or', 'USDC Address')}
                    style={{ marginTop: '8px', fontSize: '12px', color: '#2775CA', fontWeight: '500', cursor: 'pointer', border: '1px solid #2775CA', padding: '4px 12px', borderRadius: '20px', background: '#fff' }}>
                    📋 Copy USDC address
                  </button>
                </div>
              </div>

              <div style={{ background: '#EEF4FF', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#2775CA', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2775CA', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Include this in the memo field of your transfer</div>
              </div>

              <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#7D6608' }}>
                ⚠️ Make sure to send <strong>USDC on the SOLANA network only</strong>. Sending on wrong network will result in loss of funds.
              </div>
            </>
          )}

          {/* Screenshot Upload */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
              📎 Upload payment screenshot <span style={{ color: '#C0392B' }}>*required</span>
            </div>
            <label style={{
              display: 'block', border: `1.5px dashed ${receiptFile ? '#27AE60' : '#E0E0E0'}`,
              borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer',
              background: receiptFile ? '#E9F7EF' : '#fff'
            }}>
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                onChange={(e) => setReceiptFile(e.target.files[0])} />
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{receiptFile ? '✅' : '📤'}</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: receiptFile ? '#27AE60' : '#1A1A1A' }}>
                {receiptFile ? receiptFile.name : 'Tap to upload screenshot'}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>JPG, PNG or PDF · Max 5MB</div>
            </label>
          </div>

          <button onClick={submitPayment} disabled={submitting}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            {submitting ? 'Uploading & submitting...' : "I've completed the transfer"}
          </button>
        </div>
      )}

      {/* STEP 3 - Success / Verification */}
      {step === 3 && (
        <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
          <div style={{ background: '#1E8449', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', color: '#fff', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏰</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Payment status updated!</h2>
            <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>We're processing and verifying your transfer status</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#F5F5F5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Transaction reference</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{hire.paymentReference}</div>
              </div>
              <div style={{ background: '#FEF9E7', color: '#7D6608', fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>⏳ Processing</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {[
                { label: 'Worker', value: hire.worker?.user?.fullName },
                { label: 'Payment method', value: method === 'paymob' ? 'Credit Card (Paymob)' : method === 'instapay' ? 'InstaPay' : method === 'vodafone' ? 'Vodafone Cash' : method === 'bank' ? 'Bank Transfer' : 'Crypto' },
                { label: 'Amount paid', value: `EGP ${hire.totalDue?.toFixed(0)}` },
                { label: 'Status', value: '🔄 Action logged' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F5F5F5' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A1A' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Back to home
          </button>
        </div>
      )}
    </div>
  );
}