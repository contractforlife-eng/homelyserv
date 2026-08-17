import React from 'react';
import appIcon from '../../assets/homelyserv-app-icon.png';

const AnimatedIntro = () => {
  return (
    <>
      <style>{`
        @keyframes introOverlayOut {
           0% { opacity: 1; }
           70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes introLogoIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes introBrandIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-overlay {
           animation: introOverlayOut 3.5s ease-in-out forwards;
        }
        .intro-logo {
          animation: introLogoIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        .intro-brand {
          animation: introBrandIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
        }
      `}</style>
      <div className="intro-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="intro-logo flex flex-col items-center gap-4">
          <img src={appIcon} alt="HomelyServ" className="w-24 h-24 object-contain" />
          <h1 className="intro-brand text-3xl font-bold text-gray-800">HomelyServ</h1>
        </div>
      </div>
    </>
  );
};

export default AnimatedIntro;
