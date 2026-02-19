import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, CreditCard, AlertCircle, ArrowLeft, 
  ShieldCheck, Smartphone, Hash, Banknote, Zap,
  Lock, ArrowRightLeft, CheckCircle2, Clock, 
  Shield, QrCode, Wallet, TrendingUp, Sparkles,
  ExternalLink, RefreshCw, Loader
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { useRecharge } from '../../context/RechargeContext';
import { useTheme } from '../../context/ThemeContext';
import ApertureLoader from '../../components/loader/ApertureLoader';

const base_url = import.meta.env.VITE_API_KEY_Base_URL;

// Sub-Component: Modern Method Card
const PaymentMethodCard = ({ method, onSelect, isDarkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(method)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden group cursor-pointer p-5 rounded-2xl border-2 transition-all duration-500 
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-teal-400/40 hover:shadow-2xl hover:shadow-teal-900/20' 
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-100 hover:border-teal-300 hover:shadow-2xl hover:shadow-teal-100'
        }`}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 
        ${isDarkMode 
          ? 'bg-gradient-to-r from-teal-900/5 via-transparent to-teal-900/5' 
          : 'bg-gradient-to-r from-teal-50/30 via-transparent to-teal-50/30'
        }`} />
      
      {/* Glowing corner effect */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl transition-all duration-700 
        ${isHovered ? 'opacity-100' : 'opacity-0'}
        ${isDarkMode ? 'bg-teal-500/10' : 'bg-teal-400/20'}`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            {method.image ? (
              <img 
                src={method.image} 
                alt={method.name} 
                className="h-8 w-8 object-contain filter group-hover:brightness-110 transition-all duration-300" 
              />
            ) : (
              <CreditCard size={20} className="text-teal-500 group-hover:text-teal-400 transition-colors" />
            )}
          </div>
          
          <div className={`text-xs px-2 py-1 rounded-full font-bold ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            <span className="flex items-center gap-1">
              {method.paymentMethod === 'bkash' ? (
                <Zap size={10} className="text-green-500" />
              ) : (
                <Zap size={10} className="text-yellow-500" />
              )}
              Min
            </span>
          </div>
        </div>
        
        <h3 className={`text-lg font-bold mb-1 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {method.name}
        </h3>
        
        <p className={`text-xs opacity-60 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {method.accountType || 'Payment Method'}
          {method.paymentMethod === 'bkash' && ' • Auto Processing'}
        </p>
        
        <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className={`h-full w-0 group-hover:w-full transition-all duration-1000 ease-out 
            ${method.paymentMethod === 'bkash' 
              ? 'bg-gradient-to-r from-green-500 to-green-400' 
              : 'bg-gradient-to-r from-teal-500 to-teal-400'
            }`} />
        </div>
      </div>
      
      {/* Selection indicator */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300 
        ${isHovered ? 'scale-150' : 'scale-0'} 
        ${method.paymentMethod === 'bkash' ? 'bg-green-500' : 'bg-teal-500'}`} />
      
 
    </div>
  );
};

// bKash Payment Modal Component
const BkashPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  isDarkMode,
  onSuccess 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  
  const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const initiateBkashPayment = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${base_url}/api/user/deposit/bkash`,
        { amount: parseFloat(amount) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
               'userid': userId
          }
        }
      );
      
      if (response.data.success) {
        setPaymentData(response.data.data);
        
        // Open bKash payment page in new window
        if (response.data.data.paymentPageURL || response.data.data.bkashURL) {
          const paymentUrl = response.data.data.paymentPageURL || response.data.data.bkashURL;
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
          
          // Start polling for payment status
          startPaymentPolling(response.data.data.paymentID);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const startPaymentPolling = (paymentId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.post(
          `${base_url}/api/user/bkash/query-payment`,
          { paymentID: paymentId },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          const status = response.data.data.transactionStatus;
          
          if (status === 'Completed') {
            setPaymentStatus('completed');
            clearInterval(pollInterval);
            toast.success('Payment completed successfully!');
            
            // Call success callback after delay
            setTimeout(() => {
              if (onSuccess) onSuccess();
            }, 2000);
          } else if (status === 'Failed' || status === 'Canceled') {
            setPaymentStatus('failed');
            clearInterval(pollInterval);
            toast.error('Payment failed or canceled');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
    
    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed font-anek inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-2xl overflow-hidden
        ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <img 
                  src="https://play-lh.googleusercontent.com/1CRcUfmtwvWxT2g-xJF8s9_btha42TLi6Lo-qVkVomXBb_citzakZX9BbeY51iholWs=w240-h480-rw"
                  alt="bKash"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">bKash Fast Payment</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Complete payment in bKash app
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
          
          {/* Amount Display */}
          <div className="text-center py-4">
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Payment Amount
            </p>
            <p className="text-3xl font-bold text-green-500">
              ৳{parseFloat(amount).toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {paymentStatus === 'completed' ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h4 className="text-xl font-bold mb-2">Payment Successful!</h4>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your deposit has been processed successfully.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                Continue
              </button>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h4 className="text-xl font-bold mb-2">Payment Failed</h4>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please try again or use another payment method.
              </p>
              <button
                onClick={initiateBkashPayment}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors mb-3"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : paymentData ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <ExternalLink size={16} />
                  Payment Started
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  A bKash payment window has been opened. Complete the payment there, then return here.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <Loader className="animate-spin text-green-500" />
                <span>Waiting for payment confirmation...</span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.open(paymentData.paymentPageURL || paymentData.bkashURL, '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                >
                  <ExternalLink size={18} />
                  Open bKash Again
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Instructions */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <h4 className="font-bold mb-3">How to Pay:</h4>
                <ol className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white text-xs">
                      1
                    </span>
                    Click "Pay with bKash" button
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white text-xs">
                      2
                    </span>
                    Complete payment in bKash app
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white text-xs">
                      3
                    </span>
                    Return here for automatic confirmation
                  </li>
                </ol>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Zap size={20} className="text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-bold">Instant</p>
                  <p className="text-xs opacity-60">Processing</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <ShieldCheck size={20} className="text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-bold">Secure</p>
                  <p className="text-xs opacity-60">Payment</p>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={initiateBkashPayment}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-70"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://play-lh.googleusercontent.com/1CRcUfmtwvWxT2g-xJF8s9_btha42TLi6Lo-qVkVomXBb_citzakZX9BbeY51iholWs=w240-h480-rw"
                        alt="bKash"
                        className="h-5 w-5 object-contain invert"
                      />
                      Pay with bKash
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Floating Action Button
const FloatingActionButton = ({ icon: Icon, label, onClick, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
      ${isDarkMode 
        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-teal-500/30' 
        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-teal-300'
      }`}
  >
    <div className={`p-2 rounded-lg transition-all group-hover:scale-110 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Icon size={18} className="text-teal-500" />
    </div>
    <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
    </span>
  </button>
);

function Paymentmethod() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const {
    depositMethods,
    loading: rechargeLoading,
    selectedMethod,
    copiedId,
    handleCopyAgentNumber,
    handleMethodSelect,
    formatCurrency,
  } = useRecharge();

  // ============ ADDED: AUTO METHOD STATUS CHECK ============
  const [autoMethodStatus, setAutoMethodStatus] = useState(false);
  const [loadingAutoStatus, setLoadingAutoStatus] = useState(true);

  useEffect(() => {
    const fetchAutoMethodStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        
        const response = await axios.get(`${base_url}/api/user/auto-method-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId
          }
        });
        
        if (response.data.success) {
          setAutoMethodStatus(response.data.status);
        }
      } catch (error) {
        console.error('Failed to fetch auto method status:', error);
        setAutoMethodStatus(false); // Default to OFF on error
      } finally {
        setLoadingAutoStatus(false);
      }
    };

    fetchAutoMethodStatus();
  }, []);
  // ============ END ADDED ============

  const searchParams = new URLSearchParams(location.search);
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [transactionId, setTransactionId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [showBkashModal, setShowBkashModal] = useState(false);
  const [selectedBkashMethod, setSelectedBkashMethod] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Animation for success state
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        // Auto redirect after 5 seconds
        // navigate('/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const handleMethodSelection = (method) => {
    // If it's a bKash auto payment method
    if (method.paymentMethod === 'bkash') {
      setSelectedBkashMethod(method);
      setShowBkashModal(true);
      return;
    }
    
    // For regular methods
    handleMethodSelect(method);
    setShowForm(true);
    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = (text, methodId) => {
    handleCopyAgentNumber(text, methodId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!transactionId || !accountNumber || !amount) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(amount) < selectedMethod.minimumDeposit) {
      setError(`Minimum deposit amount is ${formatCurrency(selectedMethod.minimumDeposit)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${base_url}/api/user/deposit`, {
        accountNumber: accountNumber.trim(),
        transactionId: transactionId.trim(),
        amount: parseFloat(amount),
        depositMethodId: selectedMethod._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userid': userId
        }
      });

      if (response.data.success) {
        setIsSuccess(true);
        setActiveStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Payment processing failed';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSuccess) {
      navigate('/dashboard');
    } else if (showForm) {
      setShowForm(false);
      setActiveStep(1);
    } else {
      navigate('/recharge');
    }
  };

  const handleBkashSuccess = () => {
    setShowBkashModal(false);
    setIsSuccess(true);
    setActiveStep(3);
  };

  // ============ MODIFIED: Only add bKash method if auto method status is ON ============
  const allMethods = [...depositMethods];
  
  // Only add bKash method if auto method is ON
  if (autoMethodStatus) {
    const hasBkashMethod = depositMethods.some(method => method.paymentMethod === 'bkash');
    
    if (!hasBkashMethod) {
      allMethods.unshift({
        _id: 'bkash-auto-payment',
        name: 'bKash Fast',
        accountType: 'Auto Payment',
        image: 'https://play-lh.googleusercontent.com/1CRcUfmtwvWxT2g-xJF8s9_btha42TLi6Lo-qVkVomXBb_citzakZX9BbeY51iholWs=w240-h480-rw',
        agentNumber: 'AUTO-PAYMENT',
        minimumDeposit: 10,
        maximumDeposit: 50000,
        status: 'active',
        isAuto: true,
        paymentMethod: 'bkash',
        instructions: 'Complete payment in bKash app. No manual verification needed.',
        processingTime: 'Instant',
        autoApprove: true
      });
    }
  }
  // ============ END MODIFIED ============

  // Loading state
  if (rechargeLoading.depositMethods || loadingAutoStatus) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <ApertureLoader />
        <p className={`mt-6 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading payment methods...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen font-anek transition-all duration-500 relative overflow-hidden
        ${isDarkMode 
          ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white' 
          : 'bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900'
        }`}>
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-10
            ${isDarkMode ? 'bg-teal-500' : 'bg-teal-300'}`} />
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10
            ${isDarkMode ? 'bg-teal-900' : 'bg-teal-100'}`} />
        </div>

        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#374151',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px',
            },
          }}
        />
        
        <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 active:scale-95
                ${isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-teal-500/30 text-gray-300' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-teal-300 text-gray-600'
                }`}
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield size={16} className="text-teal-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-teal-500">
                  Secure Payment
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">
                Deposit Funds
              </h1>
            </div>
            
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
              <Lock size={18} className="text-teal-500" />
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm rounded-3xl border border-gray-200 p-6">
            {isSuccess ? (
              /* --- Success Screen --- */
              <div className="animate-in zoom-in-95 fade-in duration-700">
                <div className="max-w-md mx-auto text-center py-8">
                  {/* Animated success icon */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
                    <div className="relative inline-flex items-center justify-center">
                      <div className="absolute w-24 h-24 bg-teal-500 rounded-full animate-ping opacity-20" />
                      <div className="relative bg-gradient-to-br from-teal-500 to-teal-400 p-6 rounded-2xl shadow-2xl shadow-teal-500/30">
                        <CheckCircle2 size={48} className="text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">
                    Payment Successful!
                  </h2>
                  
                  <p className={`text-lg mb-8 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your deposit of <span className="font-bold text-teal-500">{formatCurrency(amount)}</span> has been submitted successfully. 
                    Funds will be added to your account shortly.
                  </p>

                  {/* Status Card */}
                  <div className={`rounded-2xl p-6 mb-8 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Clock className="text-teal-500" />
                      <h3 className="font-bold text-lg">Processing Time</h3>
                    </div>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your payment is being processed. Usually completes within:
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>5-30</div>
                        <div className="text-sm opacity-60">Minutes</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 active:scale-95"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setIsSuccess(false);
                        setActiveStep(1);
                      }}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 active:scale-95
                        ${isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      Make Another Deposit
                    </button>
                  </div>
                </div>
              </div>
            ) : !showForm ? (
              /* --- Method Selection Screen --- */
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">Choose Payment Method</h2>
                  <p className={`text-sm opacity-60 max-w-md mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select your preferred payment gateway to continue with the deposit process
                  </p>
                </div>
                
                {/* Available Methods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {allMethods.map((method) => (
                    <PaymentMethodCard 
                      key={method._id} 
                      method={method} 
                      onSelect={handleMethodSelection} 
                      isDarkMode={isDarkMode} 
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* --- Payment Form Screen --- */
              <div className="animate-in slide-in-from-bottom-8 duration-700">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      {selectedMethod.image ? (
                        <img 
                          src={selectedMethod.image} 
                          alt={selectedMethod.name} 
                          className="h-6 w-6 object-contain" 
                        />
                      ) : (
                        <CreditCard size={20} className="text-teal-500" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedMethod.name}</h2>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Complete your deposit transaction
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions Card */}
                <div className={`rounded-2xl p-6 mb-8 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Wallet size={20} className="text-teal-500" />
                        Payment Details
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Send exact amount to the account below
                      </p>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-bold ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      Step 1 of 2
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedMethod.accountType} Number
                      </span>
                      <span className="text-xs font-bold text-teal-500">
                        Copy to send money
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <Hash size={16} className="text-teal-500" />
                        </div>
                        <div>
                          <p className="font-mono text-lg font-bold tracking-wider">
                            {selectedMethod.agentNumber}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {selectedMethod.name} • {selectedMethod.accountType}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(selectedMethod.agentNumber, selectedMethod._id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 active:scale-95
                          ${copiedId === selectedMethod._id
                            ? 'bg-teal-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                      >
                        {copiedId === selectedMethod._id ? (
                          <>
                            <Check size={16} />
                            <span className="font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span className="font-medium">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Limits and Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-teal-500" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Minimum
                        </span>
                      </div>
                      <p className="font-bold text-lg">{formatCurrency(selectedMethod.minimumDeposit)}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-yellow-500" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Processing
                        </span>
                      </div>
                      <p className="font-bold text-lg">5-30 mins</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles size={20} className="text-teal-500" />
                    Transaction Information
                  </h3>

                  <div className="space-y-4">
                    {[
                      {
                        label: 'Your Account Number',
                        icon: Smartphone,
                        value: accountNumber,
                        onChange: setAccountNumber,
                        placeholder: 'Enter your mobile/account number',
                        type: 'text',
                        required: true
                      },
                      {
                        label: 'Transaction ID',
                        icon: Hash,
                        value: transactionId,
                        onChange: setTransactionId,
                        placeholder: 'Enter transaction ID from payment',
                        type: 'text',
                        required: true
                      },
                      {
                        label: 'Amount (৳)',
                        icon: Banknote,
                        value: amount,
                        onChange: setAmount,
                        placeholder: '0.00',
                        type: 'number',
                        required: true,
                        min: selectedMethod.minimumDeposit
                      }
                    ].map((field, index) => (
                      <div key={index} className="group">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <field.icon size={18} className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                          <input
                            type={field.type}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={field.placeholder}
                            min={field.min}
                            required={field.required}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 outline-none transition-all duration-300 font-medium
                              ${isDarkMode
                                ? 'bg-gray-800/50 border-gray-700 focus:border-teal-500 focus:bg-gray-800 text-white'
                                : 'bg-white border-gray-200 focus:border-teal-400 focus:bg-white text-gray-900'
                              }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                      <p className="text-red-500 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 rounded-xl transition-all duration-500
                      ${isSubmitting 
                        ? 'bg-gradient-to-r from-teal-500 to-teal-400' 
                        : 'bg-gradient-to-r from-teal-500 to-teal-400 group-hover:from-teal-400 group-hover:to-teal-300'
                      }`} />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center gap-3 py-4 px-6 rounded-xl">
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="font-bold text-white">Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} className="text-white" />
                          <span className="font-bold text-white text-lg">Complete Deposit</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* bKash Payment Modal */}
      <BkashPaymentModal
        isOpen={showBkashModal}
        onClose={() => setShowBkashModal(false)}
        amount={amount}
        isDarkMode={isDarkMode}
        onSuccess={handleBkashSuccess}
      />
    </>
  );
}

export default Paymentmethod;