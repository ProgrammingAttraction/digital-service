import React, { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/auth/login/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Register from './pages/auth/register/Register'
import Order from './pages/order/Order'
import Recharge from './pages/recharge/Recharge'
import Newnidcard from './pages/autoservices/newnidcard/Newnidcard'
import Oldnid from './pages/autoservices/oldnid/Oldnid'
import Birthcertificate from './pages/autoservices/birthcertificate/Birthcertificate'
import Newbirthcertificate from './pages/autoservices/birthcertificate/Newbirthcertificate'
import Oldbirthcertificate from './pages/autoservices/birthcertificate/Oldbirthcertificate'
import Servercopy from './pages/autoservices/servercopy/Servercopy'
import Signtoserver from './pages/autoservices/servercopy/Signtoserver'
import Policeclearance from './pages/autoservices/policeclearance/Policeclearance'
import Takmulcertificate from './pages/autoservices/takmulcertificate/Takmulcertificate'
import Surokkhaclone from './pages/autoservices/surokkhaclone/Surokkhaclone'
import Profile from './pages/profile/Profile'
import Forget from './pages/auth/forget/Forget'
import Nidverify from './pages/autoservices/nidverify/Nidverify'
import Fileorder from './pages/order/Fileorder'
import Textorder from './pages/order/Textorder'
import Orderdetails from './pages/order/Orderdetails'
import Signcopy from './pages/orderservices/signcopy/Signcopy'
import Biomatrix from './pages/orderservices/biomatrics/Biomatrix'
import Calllist from './pages/orderservices/calllist/Calllist'
import Passportmake from './pages/orderservices/passportmake/Passportmake'
import Vomionnoyon from './pages/cloneservices/vomionnoyon/Vomionnoyon'
import Vomionnoyonprint from './pages/cloneservices/vomionnoyon/Vomionnoyonprint'
import Policeclearanceprint from './pages/autoservices/policeclearance/Policeclearanceprint'
import Takmulcertificateprint from './pages/autoservices/takmulcertificate/Takmulcertificateprint'
import Surokkhacloneprint from './pages/autoservices/surokkhaclone/Surokkhacloneprint'
import Tradelicense from './pages/cloneservices/tradelicense/Tradelicense'
import TradeLicensePrint from './pages/cloneservices/tradelicense/TradeLicensePrint'
import TaxReturn from './pages/cloneservices/taxreturn/Taxreturn'
import TaxReturnPrint from './pages/cloneservices/taxreturn/TaxReturnPrint'
import TinCertificatePrint from './pages/cloneservices/tincertificate/TinCertificatePrint'
import TinCertificate from './pages/cloneservices/tincertificate/TinCertificate'
import SscCertificate from './pages/cloneservices/ssccertificate/SscCertificate'
import SscCertificatePrint from './pages/cloneservices/ssccertificate/SscCertificatePrint'
import HscCertificate from './pages/cloneservices/hsccertificate/HscCertificate'
import HscCertificatePrint from './pages/cloneservices/hsccertificate/HscCertificatePrint'
import NagorikSonod from './pages/cloneservices/nagoriksonod/Nagoriksonod'
import NagorikSonodPrint from './pages/cloneservices/nagoriksonod/NagorikSonodPrint'
import Newnidcardprint from './pages/autoservices/newnidcard/Newnidcardprint'
import Smartnid from './pages/autoservices/smartnid/Smartnid'
import DeathCertificate from './pages/autoservices/deathcertificate/Deathcertificate'
import DeathCertificatePrint from './pages/autoservices/deathcertificate/DeathCertificatePrint'
import Manualbirthcertificate from './pages/autoservices/manualbirthcertificate/Manualbirthcertificate'
import Manualbirthcertificateprint from './pages/autoservices/manualbirthcertificate/Manualbirthcertificateprint'
import Autotincertificate from './pages/autoservices/autotincertificate/Autotincertificate'
import Paymentmethod from './pages/recharge/Paymentmethod'
import TaxReturnAcknowledgement from './pages/cloneservices/acknowledgereturn/TaxReturnAcknowledgement'
import TaxReturnAcknowledgementPrint from './pages/cloneservices/acknowledgereturn/TaxReturnAcknowledgementPrint'
import UttoradhikarSonodPrint from './pages/cloneservices/uttoradhikarsonod/UttoradhikarSonodPrint'
import UttoradhikarSonod from './pages/cloneservices/uttoradhikarsonod/UttoradhikarSonod'
import Smartnidprint from './pages/autoservices/smartnid/Smartnidprint'
import Birthcertificateprint from './pages/autoservices/birthcertificate/Birthcertificateprint'
import Servercopyprint from './pages/autoservices/servercopy/Servercopyprint'
import Servercopyprint2 from './pages/autoservices/servercopy/Servercopyprint2'
import Servercopyprint3 from './pages/autoservices/servercopy/Servercopyprint3'
import NumberToLocation from './pages/orderservices/numbertolocation/Numbertolocation'
import IMEIToNumber from './pages/orderservices/imeitonumber/IMEIToNumber'
import NidUserPass from './pages/orderservices/niduserpass/NidUserPass'
import TinCertificateOrder from './pages/orderservices/tincertificateorder/TinCertificateOrder'
import ZeroReturn from './pages/orderservices/zeroreturn/ZeroReturn'
import NidToAllNumber from './pages/orderservices/nidtoallnumber/NidToAllNumber'
import Smartcardorder from './pages/orderservices/smartcardorder/Smartcardorder'
import NidCardOrder from './pages/orderservices/nidcardorder/NidCardOrder'
import Servercopyorder from './pages/orderservices/servercopyorder/Servercopyorder'
import NameAddressToNid from './pages/orderservices/nameaddresstonid/NameAddressToNid'
import NewBirthCertificate from './pages/orderservices/newbirthcertificate/NewBirthCertificate'
import Autotincertificateprint from './pages/autoservices/autotincertificate/Autotincertificateprint'
import Servercopyunofficial1 from './pages/autoservices/servercopyunofficial/Servercopyunofficial1'
import Servercopyunofficial2 from './pages/autoservices/servercopyunofficial/Servercopyunofficial2'
import Servercopyunofficial3 from './pages/autoservices/servercopyunofficial/Servercopyunofficial3'
import Nidmake2 from './pages/autoservices/nidmake2/Nidmake2'
import Nidmake2print from './pages/autoservices/nidmake2/Nidmake2print'
import BirthData from './pages/autoservices/birthdata/BirthData'
import ApertureLoader from './components/loader/ApertureLoader'
import AutoNidMaker from './pages/autoservices/autonidmaker/AutoNidMaker'
import AutoNidMakerPrint from './pages/autoservices/autonidmaker/AutoNidMakerPrint'

// Maintenance Page Component
// Maintenance Page Component - Enhanced Version
const MaintenancePage = ({ message }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing maintenance...');
  
  // Simulate progress for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1;
      });
    }, 300);

    // Update loading text
    const texts = [
      'Checking system updates...',
      'Optimizing database...',
      'Applying security patches...',
      'Almost ready...',
      'Finalizing maintenance...'
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
      if (textIndex < texts.length - 1) {
        textIndex++;
        setLoadingText(texts[textIndex]);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-10 animate-float"
            style={{
              width: Math.random() * 8 + 3 + 'px',
              height: Math.random() * 8 + 3 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-56 h-56 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-56 h-56 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-56 h-56 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-3xl w-full text-center relative z-10">
        {/* Animated Icon with Pulse Effect */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white opacity-20 rounded-full animate-ping"></div>
          </div>
          <div className="relative animate-bounce">
            <svg className="w-20 h-20 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="10s"
                repeatCount="indefinite"
              />
            </svg>
          </div>
        </div>

        {/* Title with Gradient Text */}
        <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-200 to-pink-200 animate-gradient">
          Under Maintenance
        </h1>

        {/* Animated Subtitle */}
        <div className="mb-5 overflow-hidden">
          <p className="text-base text-white text-opacity-90 animate-slide-in">
            🚀 We're upgrading our systems to serve you better
          </p>
        </div>

        {/* Glassmorphism Message Card */}
        <div className="bg-opacity-10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white border-opacity-20 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
            </span>
            <span className="ml-2 text-yellow-300 text-sm font-semibold">Live Status: In Progress</span>
          </div>
          
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            {message || "We're currently performing scheduled maintenance. We'll be back shortly!"}
          </p>

          {/* Progress Section */}
          <div className="mt-6 space-y-3">
            {/* Progress Bar with Animation */}
            <div className="relative pt-1">
              <div className="flex mb-1.5 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-white bg-opacity-20">
                    Maintenance Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-white">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-3 text-xs flex rounded-full bg-white bg-opacity-20">
                <div 
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-500 relative"
                >
                  {progress > 0 && (
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading Text with Typing Effect */}
            <div className="flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-white text-opacity-80 text-xs font-mono">
                {loadingText}
              </p>
            </div>
          </div>
        </div>

        {/* Animated Footer */}
        <div className="mt-8 relative">
          <div className="relative flex justify-center">
            <span className="px-3 bg-transparent text-white text-opacity-60 text-xs">
              ⚡ System maintenance in progress
            </span>
          </div>
        </div>

        <p className="mt-4 text-white text-opacity-50 text-xs">
          © 2024 All rights reserved. We apologize for the inconvenience.
        </p>
      </div>

      {/* Add custom keyframes for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slide-in {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-slide-in {
          animation: slide-in 1s ease-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        try {
          // You can also verify token validity by making an API call here
          setIsAuthenticated(true)
        } catch (error) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Main App Component
const App = () => {
  const [websiteActive, setWebsiteActive] = useState(true)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(true)
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Check website status on app load
  useEffect(() => {
    const checkWebsiteStatus = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/website-status`)
        if (response.data.success) {
          setWebsiteActive(response.data.isActive)
          setMaintenanceMessage(response.data.message || '')
        } else {
          // If API fails, assume website is active
          setWebsiteActive(true)
        }
      } catch (error) {
        console.error('Failed to check website status:', error)
        // If API fails, assume website is active to prevent blocking users
        setWebsiteActive(true)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkWebsiteStatus()
  }, [])

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
        <ApertureLoader/>
      </div>
    )
  }

  // If website is inactive, show maintenance page
  if (!websiteActive) {
    return <MaintenancePage message={maintenanceMessage} />
  }

  // Otherwise, show normal app
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }/>
        <Route path="/forget-password" element={
          <PublicRoute>
            <Forget />
          </PublicRoute>
        }/>
        <Route path="/registration" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }/>

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
        {/* ----------------order------------------- */}
        <Route path="/order/history" element={
          <ProtectedRoute>
            <Order />
          </ProtectedRoute>
        }/>
        <Route path="/order/text-order" element={
          <ProtectedRoute>
            <Textorder />
          </ProtectedRoute>
        }/>
        <Route path="/order/file-order" element={
          <ProtectedRoute>
            <Fileorder />
          </ProtectedRoute>
        }/>
        <Route path="/service/details/:id" element={
          <ProtectedRoute>
            <Orderdetails />
          </ProtectedRoute>
        }/>
        {/* ----------------order------------------- */}
      
        <Route path="/recharge" element={
          <ProtectedRoute>
            <Recharge />
          </ProtectedRoute>
        }/>
        <Route path="/payment-method" element={
          <ProtectedRoute>
            <Paymentmethod />
          </ProtectedRoute>
        }/>
        {/* -----------------------------order-services------------------------- */}
        <Route path="/order-services/sign-copy" element={
          <ProtectedRoute>
            <Signcopy />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/gp-biometric" element={
          <ProtectedRoute>
            <Biomatrix />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/call-list" element={
          <ProtectedRoute>
            <Calllist />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/passport-make" element={
          <ProtectedRoute>
            <Passportmake />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/number-to-location" element={
          <ProtectedRoute>
            <NumberToLocation />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/imei-to-number" element={
          <ProtectedRoute>
            <IMEIToNumber />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/nid-user-pass" element={
          <ProtectedRoute>
            <NidUserPass />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/tin-certificate-order" element={
          <ProtectedRoute>
            <TinCertificateOrder />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/zero-return" element={
          <ProtectedRoute>
            <ZeroReturn />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/nid-to-all-number" element={
          <ProtectedRoute>
            <NidToAllNumber />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/smart-card-order" element={
          <ProtectedRoute>
            <Smartcardorder />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/nid-card-order" element={
          <ProtectedRoute>
            <NidCardOrder />
          </ProtectedRoute>
        }/>
        <Route path="/order-services/name-address-to-nid" element={
          <ProtectedRoute>
            <NameAddressToNid/>
          </ProtectedRoute>
        }/>
        <Route path="/order-services/new-birth-registration" element={
          <ProtectedRoute>
            <NewBirthCertificate/>
          </ProtectedRoute>
        }/>
        <Route path="/order-services/server-copy-order" element={
          <ProtectedRoute>
            <Servercopyorder />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/police-clearance-clone" element={
          <ProtectedRoute>
            <Policeclearance />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/vomi-unnoyon-kor" element={
          <ProtectedRoute>
            <Vomionnoyon />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/vomi-unnoyon-kor-downlaod/:id" element={
          <ProtectedRoute>
            <Vomionnoyonprint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/police-clearance-clone-download/:id" element={
          <ProtectedRoute>
            <Policeclearanceprint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/takamul-certificate-clone" element={
          <ProtectedRoute>
            <Takmulcertificate />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/takamul-certificate-clone-download/:id" element={
          <ProtectedRoute>
            <Takmulcertificateprint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/suraksha-clone" element={
          <ProtectedRoute>
            <Surokkhaclone />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/surokkha-clone-download/:id" element={
          <ProtectedRoute>
            <Surokkhacloneprint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/trade-license-clone" element={
          <ProtectedRoute>
            <Tradelicense />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/trade-license-clone-download/:id" element={
          <ProtectedRoute>
            <TradeLicensePrint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/tax-return-clone" element={
          <ProtectedRoute>
            <TaxReturn />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/tax-return-clone-download/:id" element={
          <ProtectedRoute>
            <TaxReturnPrint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/tin-certificate-clone" element={
          <ProtectedRoute>
            <TinCertificate />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/tin-certificate-clone-download/:id" element={
          <ProtectedRoute>
            <TinCertificatePrint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/ssc-certificate-clone" element={
          <ProtectedRoute>
            <SscCertificate />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/ssc-certificate-clone-download/:id" element={
          <ProtectedRoute>
            <SscCertificatePrint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/hsc-certificate-clone" element={
          <ProtectedRoute>
            <HscCertificate />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/hsc-certificate-clone-download/:id" element={
          <ProtectedRoute>
            <HscCertificatePrint />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/citizen-certificate" element={
          <ProtectedRoute>
            <NagorikSonod />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/citizen-certificate-download/:id" element={
          <ProtectedRoute>
            <NagorikSonodPrint />
          </ProtectedRoute>
        }/>
        
        {/* -----------------------------order-services------------------------- */}

        <Route path="/auto-services/new-nid" element={
          <ProtectedRoute>
            <Newnidcard />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/new-nid-download/:id" element={
          <ProtectedRoute>
            <Newnidcardprint />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/new-nid2" element={
          <ProtectedRoute>
            <Nidmake2 />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/new-nid2-download/:id" element={
          <ProtectedRoute>
            <Nidmake2print />
          </ProtectedRoute>
        }/>
        {/* --------------------death-certificate------------------------------- */}
        <Route path="/auto-services/death-certificate" element={
          <ProtectedRoute>
            <DeathCertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/death-certificate-download/:id" element={
          <ProtectedRoute>
            <DeathCertificatePrint />
          </ProtectedRoute>
        }/>
        {/* -------------------death-certificate------------------------------ */}

        {/* -----------------------manually-birth-certificate---------------------------- */}
        <Route path="/auto-services/manually-birth-registration" element={
          <ProtectedRoute>
            <Manualbirthcertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/manually-birth-registration-download/:id" element={
          <ProtectedRoute>
            <Manualbirthcertificateprint />
          </ProtectedRoute>
        }/>
        {/* -----------------------manually-birth-certificate---------------------------- */}
        
        {/* -----------------------acknowledge-return---------------------------- */}
        <Route path="/clone-services/acknowledge-return-clone" element={
          <ProtectedRoute>
            <TaxReturnAcknowledgement />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/acknowledge-return-clone-download/:id" element={
          <ProtectedRoute>
            <TaxReturnAcknowledgementPrint />
          </ProtectedRoute>
        }/>
        {/* -----------------------acknowledge-return---------------------------- */}

        {/* -----------------------uttoradhikar-sonod---------------------------- */}
        <Route path="/clone-services/inheritance-certificate" element={
          <ProtectedRoute>
            <UttoradhikarSonod />
          </ProtectedRoute>
        }/>
        <Route path="/clone-services/inheritance-certificate-download/:id" element={
          <ProtectedRoute>
            <UttoradhikarSonodPrint />
          </ProtectedRoute>
        }/>
        {/* -----------------------uttoradhikar-sonod---------------------------- */}

        {/* -----------------------tin-certificate---------------------------- */}
        <Route path="/auto-services/tin-certificate-auto" element={
          <ProtectedRoute>
            <Autotincertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/tin-certificate-auto-download/:id" element={
          <ProtectedRoute>
            <Autotincertificateprint />
          </ProtectedRoute>
        }/>
        {/* -----------------------tin-certificate---------------------------- */}


        <Route path="/auto-services/auto-id-maker" element={
          <ProtectedRoute>
            <AutoNidMaker />
          </ProtectedRoute>
        }/>

                <Route path="/auto-services/auto-nid-maker-download/:id" element={
          <ProtectedRoute>
            <AutoNidMakerPrint />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/verify-nid" element={
          <ProtectedRoute>
            <Nidverify />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/smart-nid" element={
          <ProtectedRoute>
            <Smartnid />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/smart-nid-download/:id" element={
          <ProtectedRoute>
            <Smartnidprint />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/old-nid" element={
          <ProtectedRoute>
            <Oldnid />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/auto-birth-registration" element={
          <ProtectedRoute>
            <Birthcertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/auto-birth-registration-download/:id" element={
          <ProtectedRoute>
            <Birthcertificateprint />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/new-birth-registration" element={
          <ProtectedRoute>
            <Newbirthcertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/old-birth-registration" element={
          <ProtectedRoute>
            <Oldbirthcertificate />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/server-copy-unofficial" element={
          <ProtectedRoute>
            <Servercopy />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/server-copy-unofficial-download/v1/:id" element={
          <ProtectedRoute>
            <Servercopyunofficial1 />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/server-copy-unofficial-download/v2/:id" element={
          <ProtectedRoute>
            <Servercopyunofficial2 />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/server-copy-unofficial-download/v3/:id" element={
          <ProtectedRoute>
            <Servercopyunofficial3 />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/sign-to-server-copy" element={
          <ProtectedRoute>
            <Signtoserver />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/sign-to-server-copy-download/v1/:id" element={
          <ProtectedRoute>
            <Servercopyprint />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/sign-to-server-copy-download/v2/:id" element={
          <ProtectedRoute>
            <Servercopyprint2 />
          </ProtectedRoute>
        }/>
        <Route path="/auto-services/sign-to-server-copy-download/v3/:id" element={
          <ProtectedRoute>
            <Servercopyprint3 />
          </ProtectedRoute>
        }/>
        {/* --------------------birth-data------------------------- */}
        <Route path="/auto-services/birth-data" element={
          <ProtectedRoute>
            <BirthData />
          </ProtectedRoute>
        }/>
        {/* --------------------birth-data------------------------- */}

        <Route path="/account/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }/>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App