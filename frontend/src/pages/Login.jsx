import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('emad@homelyserv.com');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-gray-500 text-sm mt-1">Your Home, Our Priority</p>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-6">Sign in to access your HomelyServ account</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-red-600 focus:ring-red-500" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-red-600 hover:underline">Forget password?</Link>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium text-lg"
          >
            Login
          </button>
        </form>

        <div className="text-center my-6">
          <p className="text-gray-400 text-sm">OR CONTINUE WITH</p>
          <button className="mt-2 w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <span className="text-red-500 font-medium">Google</span>
            <span className="text-gray-400">تسجيل الدخول باستخدام</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account? <Link to="/register" className="text-red-600 font-medium hover:underline">Create one</Link>
          </p>
          <p className="text-xs text-gray-400 mt-4">Secure. Reliable. Always here for your home.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;