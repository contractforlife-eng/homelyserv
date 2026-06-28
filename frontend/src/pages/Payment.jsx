import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Wallet, Phone, Building, CheckCircle, Upload, FileText, 
  ArrowLeft, Copy, Check, CreditCard, Banknote, Calendar,
  Clock, AlertCircle, Download, Printer, Eye, X
} from 'lucide-react';

function Payment() {
  const navigate = useNavigate();
  const { hireId } = useParams();
  const [selectedMethod, setSelectedMethod] = useState('instapay');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Payment methods configuration
  const paymentMethods = [
    { 
      id: 'instapay', 
      name: 'InstaPay', 
      icon: <Wallet size={24} />, 
      number: '01009189851',
      description: 'Pay instantly using InstaPay mobile app',
      processingTime: 'Instant - 2 hours'
    },
    { 
      id: 'vodafone', 
      name: 'Vodafone Cash', 
      icon: <Phone size={24} />, 
      number: '01009189851',
      description: 'Pay using Vodafone Cash mobile wallet',
      processingTime: '1-2 hours'
    },
    { 
      id: 'bank', 
      name: 'Bank Transfer', 
      icon: <Building size={24} />, 
      number: '1002425938683',
      description: 'Transfer via bank account (QNB)',
      processingTime: '24-48 hours',
      bankDetails: {
        accountNumber: '1002425938683',
        iban: 'EG580037000908181002425938683',
        swift: 'QNBAEGCXXXX',
        bankName: 'QNB Alahli',
        branch: 'Cairo Main Branch'
      }
    }
  ];

  const hireDetails = {
    id: hireId || 'HS-2026-0001',
    worker: 'Ahmed Ali',
    position: 'Nanny - Full Time',
    salary: 3500,
    commission: 227.50,
    vat: 31.85,
    totalDue: 3759.35
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = () => {
    setStep(2);
    setTimeout(() => setStep(3), 3000);
  };

  const getMethod = () => paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/my-hires" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition">
            <ArrowLeft size={18} /> Back to Hires
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Complete Payment</h1>
        </div>

        {step === 1 && (
          <>
            {/* Hire Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Hire Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Worker</p>
                  <p className="font-medium text-gray-800">{hireDetails.worker}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium text-gray-800">{hireDetails.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire ID</p>
                  <p className="font-medium text-gray-800 font-mono">{hireDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Agreed Salary</p>
                  <p className="font-medium text-gray-800">EGP {hireDetails.salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commission (6.5%)</p>
                  <p className="font-medium text-gray-800">EGP {hireDetails.commission.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">VAT (14%)</p>
                  <p className="font-medium text-gray-800">EGP {hireDetails.vat.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <p className="text-lg font-bold text-gray-800">Total Due</p>
                <p className="text-2xl font-bold text-red-600">EGP {hireDetails.totalDue.toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedMethod === method.id 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-lg ${
                        selectedMethod === method.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method.icon}
                      </div>
                      <p className="font-semibold mt-2">{method.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {method.processingTime}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment Instructions */}
              {selectedMethod === 'instapay' && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">How to pay with InstaPay</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li>1. Open your bank's mobile app</li>
                    <li>2. Select InstaPay transfer</li>
                    <li>3. Enter recipient number: <strong>01009189851</strong></li>
                    <li>4. Enter the exact amount: <strong>EGP {hireDetails.totalDue.toFixed(2)}</strong></li>
                    <li>5. Add reference code: <strong>{hireDetails.id}</strong></li>
                    <li>6. Upload screenshot as proof of payment</li>
                  </ol>
                </div>
              )}

              {selectedMethod === 'vodafone' && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">How to pay with Vodafone Cash</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li>1. Dial <strong>*9#</strong> from your Vodafone number</li>
                    <li>2. Select "Send Money"</li>
                    <li>3. Enter recipient number: <strong>01009189851</strong></li>
                    <li>4. Enter the exact amount: <strong>EGP {hireDetails.totalDue.toFixed(2)}</strong></li>
                    <li>5. Add reference code: <strong>{hireDetails.id}</strong></li>
                    <li>6. Upload screenshot as proof of payment</li>
                  </ol>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bank Name</span>
                      <span className="font-medium">QNB Alahli</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">1002425938683</span>
                        <button onClick={() => copyToClipboard('1002425938683')} className="p-1 text-gray-400 hover:text-gray-600">
                          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IBAN</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-xs">EG580037000908181002425938683</span>
                        <button onClick={() => copyToClipboard('EG580037000908181002425938683')} className="p-1 text-gray-400 hover:text-gray-600">
                          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">SWIFT Code</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">QNBAEGCXXXX</span>
                        <button onClick={() => copyToClipboard('QNBAEGCXXXX')} className="p-1 text-gray-400 hover:text-gray-600">
                          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Branch</span>
                      <span className="font-medium">Cairo Main Branch</span>
                    </div>
                    <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                      <p>For domestic transfers, use Account Number only</p>
                      <p>For international transfers, use IBAN and SWIFT</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Proof */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Upload Proof of Payment</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition">
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={24} className="text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => setUploadedFile(null)} className="p-1 text-red-500 hover:text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">Supported: JPG, PNG, PDF (Max 5MB)</p>
                      <button
                        onClick={() => document.getElementById('file-upload').click()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                      >
                        Choose File
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
              </div>

              {/* Additional Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Add any additional information about the payment..."
                />
              </div>

              <button
                onClick={handlePayment}
                disabled={!uploadedFile}
                className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Payment
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Processing Payment...</h3>
            <p className="text-gray-500 mt-2">Please wait while we confirm your payment</p>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
            <p className="text-gray-600 mb-6">Your payment will be verified by admin within 24-48 hours.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-medium">{hireDetails.id}</span>
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-yellow-600">Pending Verification</span>
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">EGP {hireDetails.totalDue.toFixed(2)}</span>
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{getMethod()?.name}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/my-hires')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Go to My Hires
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <Download size={18} /> Download Receipt
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <Printer size={18} /> Print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;