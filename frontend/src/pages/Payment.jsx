import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Wallet, Phone, Building, CheckCircle, Upload, FileText, ArrowLeft, Copy, Check } from 'lucide-react';

function Payment() {
  const navigate = useNavigate();
  const { hireId } = useParams();
  const [selectedMethod, setSelectedMethod] = useState('instapay');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [step, setStep] = useState(1);

  const paymentMethods = [
    { id: 'instapay', name: 'InstaPay', icon: <Wallet size={24} />, number: '01009189851' },
    { id: 'vodafone', name: 'Vodafone Cash', icon: <Phone size={24} />, number: '01009189851' },
    { id: 'bank', name: 'Bank Transfer', icon: <Building size={24} />, number: '1002425938683' }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handlePayment = () => {
    setStep(2);
    setTimeout(() => setStep(3), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/my-hires" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft size={18} /> Back to Hires
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Complete Payment</h1>
        </div>

        {step === 1 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Hire Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Worker</p><p className="font-medium text-gray-800">Ahmed Ali</p></div>
                <div><p className="text-sm text-gray-500">Position</p><p className="font-medium text-gray-800">Nanny - Full Time</p></div>
                <div><p className="text-sm text-gray-500">Agreed Salary</p><p className="font-medium text-gray-800">EGP 3,500</p></div>
                <div><p className="text-sm text-gray-500">Total Due</p><p className="font-bold text-red-600 text-lg">EGP 3,759.35</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedMethod === method.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {method.icon}
                      </div>
                      <p className="font-medium mt-2">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.number}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Upload Proof of Payment</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition">
                  <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">Supported: JPG, PNG, PDF (Max 5MB)</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <button
                    onClick={() => document.getElementById('file-upload').click()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                  >
                    Choose File
                  </button>
                  {uploadedFile && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600">
                      <CheckCircle size={16} /> {uploadedFile.name}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
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
                <span className="font-medium">HS-2026-0001</span>
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-yellow-600">Pending Verification</span>
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">EGP 3,759.35</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-hires')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go to My Hires
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;