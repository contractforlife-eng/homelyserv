import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hire, setHire] = useState(null);
  const [method, setMethod] = useState('instapay');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1=choose, 2=instructions, 3=success

  useEffect(() => {
    api.get(`/hires/my`).then(res => {
      const found = res.data.find(h => h.id === id);
      setHire(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const submitPayment = async () => {
    setSubmitting(true);
    try {
      await api.put(`/hires/${id}/payment`, {
        paymentMethod: method,
        paymentProofUrl: 'pending_upload'
      });
      setStep(3);
      toast.success('Payment submitted!');
    } catch (err) {
      toast.error('Failed to submit payment');
    }
    setSubmitting(false);
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>;
  if (!hire) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Hire not found</div>;

  const paymentMethods = [
    { id: 'instapay', label: 'InstaPay', desc: 'Transfer via any Egyptian bank app', color: '#1A3C8F', short: 'IP' },
    { id: 'vodafone', label: 'Vodafone Cash', desc: 'Pay from your Vodafone wallet', color: '#E2001A', short: 'VC' },
    { id: 'bank', label: 'Bank Transfer', desc: 'QNB Al Ahli · IBAN supported', color: '#1A6B3C', short: 'BK' },
    { id: 'bitcoin', label: 'Bitcoin (BTC)', desc: 'Send BTC via Bitcoin Network', color: '#F7931A', short: '₿' },
    { id: 'usdc', label: 'USDC (Solana)', desc: 'Send USDC on Solana Network', color: '#9945FF', short: '◈' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '0' }}>
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
              <div style={{ marginTop: '8px', padding: '8px', background: '#F5F5F5', borderRadius: '6px', fontSize: '11px', color: '#888' }}>
                💡 Crypto payments: Send exact USD equivalent (calculate using current exchange rate)
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '8px', letterSpacing: '0.4px' }}>SELECT PAYMENT METHOD</div>

          {paymentMethods.map(m => (
            <div key={m.id} onClick={() => setMethod(m.id)}
              style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: method === m.id ? '1.5px solid #C0392B' : '1.5px solid #E0E0E0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
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

          <div style={{ fontSize: '12px', color: '#888', padding: '4px 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔒 Payment verified by HomelyServ admin within 2 hours
          </div>

          <button onClick={() => setStep(2)}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Proceed to payment
          </button>
        </div>
      )}

      {/* STEP 2 - Instructions */}
      {step === 2 && (
        <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
          {/* Amount box */}
          <div style={{ background: method === 'vodafone' ? '#E2001A' : method === 'bank' ? '#1A6B3C' : method === 'bitcoin' ? '#F7931A' : method === 'usdc' ? '#9945FF' : '#1A3C8F', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px', color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Amount to transfer</div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>EGP {hire.totalDue?.toFixed(0)}</div>
            {method === 'bitcoin' && (
              <div style={{ fontSize: '14px', opacity: 0.85, marginTop: '4px' }}>
                ≈ ${(hire.totalDue / 50).toFixed(2)} USD (check current BTC rate)
              </div>
            )}
            {method === 'usdc' && (
              <div style={{ fontSize: '14px', opacity: 0.85, marginTop: '4px' }}>
                ≈ ${(hire.totalDue / 50).toFixed(2)} USDC (1 USDC ≈ 1 USD)
              </div>
            )}
            <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>Commission · {hire.worker?.user?.fullName}</div>
          </div>

          {/* InstaPay & Vodafone steps */}
          {(method === 'instapay' || method === 'vodafone') && (
            <>
              {[
                {
                  n: 1,
                  title: method === 'instapay' ? 'Open your bank app' : 'Open Vodafone Cash',
                  body: method === 'instapay' ? 'Open the InstaPay section in your bank app (CIB, Banque Misr, NBE, QNB, or any participating bank).' : 'Dial *9# from your Vodafone number or open My Vodafone app → Vodafone Cash → Send Money.'
                },
                {
                  n: 2,
                  title: 'Send to this number',
                  body: null,
                  number: '01009189851'
                },
                {
                  n: 3,
                  title: 'Add reference code',
                  body: null,
                  ref: hire.paymentReference
                },
                {
                  n: 4,
                  title: `Transfer exactly EGP ${hire.totalDue?.toFixed(0)}`,
                  body: 'Send the exact amount shown. Partial payments are not accepted.'
                }
              ].map(s => (
                <div key={s.n} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#C0392B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: '0' }}>{s.n}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{s.title}</div>
                  </div>
                  {s.body && <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>{s.body}</div>}
                  {s.number && (
                    <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>HomelyServ recipient number</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '1px' }}>{s.number}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>HomelyServ Payments</div>
                    </div>
                  )}
                  {s.ref && (
                    <div style={{ background: '#FDECEA', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{s.ref}</div>
                      <div style={{ fontSize: '11px', color: '#C0392B', marginTop: '4px', opacity: 0.8 }}>Add this in the note/description field</div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Bank transfer steps */}
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
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A1A', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FDECEA', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <div style={{ fontSize: '11px', color: '#C0392B', marginTop: '4px', opacity: 0.8 }}>Include this in the transfer description</div>
              </div>
              <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#7D6608' }}>
                ℹ️ Bank transfers are verified within 24 hours on business days.
              </div>
            </>
          )}

          {/* Bitcoin steps */}
          {method === 'bitcoin' && (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
                  Send BTC (Bitcoin)
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Network</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>BITCOIN (BTC)</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888' }}>Wallet Address</div>
                    <button 
                      onClick={() => copyToClipboard('bc1qvgm3ypfv9zhzgp7wxet5ap4uxmxs3jetnaghdt6mfqeez0kfzhqs3uerph')}
                      style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '12px' }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '12px', wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace' }}>
                    bc1qvgm3ypfv9zhzgp7wxet5ap4uxmxs3jetnaghdt6mfqeez0kfzhqs3uerph
                  </div>
                </div>
              </div>

              <div style={{ background: '#FDECEA', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <div style={{ fontSize: '11px', color: '#C0392B', marginTop: '4px', opacity: 0.8 }}>Include this in the memo/note field</div>
              </div>

              <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#7D6608' }}>
                ⚠️ Send the exact USD equivalent of EGP {hire.totalDue?.toFixed(0)} using current BTC exchange rate.
                Allow 1-3 confirmations (approx 30-60 minutes) for verification.
              </div>
            </>
          )}

          {/* USDC (Solana) steps */}
          {method === 'usdc' && (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
                  Send USDC (Solana)
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Network</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>SOLANA (SPL)</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888' }}>Wallet Address</div>
                    <button 
                      onClick={() => copyToClipboard('6vRak8Jumw2QjgMKJCnvZxYxKW4hPvUceBGM5Zxqq4or')}
                      style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '12px' }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '12px', wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace' }}>
                    6vRak8Jumw2QjgMKJCnvZxYxKW4hPvUceBGM5Zxqq4or
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                  💡 Make sure to use the Solana network (SPL) - sending on other networks will result in loss of funds.
                </div>
              </div>

              <div style={{ background: '#FDECEA', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600', marginBottom: '4px' }}>🏷 Payment reference</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B', letterSpacing: '2px' }}>{hire.paymentReference}</div>
                <div style={{ fontSize: '11px', color: '#C0392B', marginTop: '4px', opacity: 0.8 }}>Include this in the memo field</div>
              </div>

              <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#7D6608' }}>
                ⚠️ Send the exact USD equivalent of EGP {hire.totalDue?.toFixed(0)} USDC.
                1 USDC ≈ 1 USD. Transactions confirm within seconds on Solana network.
              </div>
            </>
          )}

          <button onClick={submitPayment} disabled={submitting}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '6px' }}>
            {submitting ? 'Submitting...' : "I've completed the transfer"}
          </button>
        </div>
      )}

      {/* STEP 3 - Success */}
      {step === 3 && (
        <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
          <div style={{ background: '#1E8449', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', color: '#fff', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '32px' }}>⏰</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Payment submitted!</h2>
            <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>We're verifying your transfer — usually within 2 hours</p>
            {['bitcoin', 'usdc'].includes(method) && (
              <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                Crypto payments may take 1-3 confirmations (approx 10-60 minutes)
              </p>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: '#F5F5F5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Transaction reference</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{hire.paymentReference}</div>
              </div>
              <div style={{ background: '#FEF9E7', color: '#7D6608', fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>⏳ Pending</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {[
                { label: 'Worker', value: hire.worker?.user?.fullName },
                { label: 'Payment method', value: method === 'instapay' ? 'InstaPay' : method === 'vodafone' ? 'Vodafone Cash' : method === 'bank' ? 'Bank Transfer' : method === 'bitcoin' ? 'Bitcoin (BTC)' : 'USDC (Solana)' },
                { label: 'Amount paid', value: `EGP ${hire.totalDue?.toFixed(0)}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F5F5F5' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A1A' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#FEF9E7', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#7D6608' }}>
            ℹ️ Admin will verify your payment and activate the hire. You'll be notified once confirmed.
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