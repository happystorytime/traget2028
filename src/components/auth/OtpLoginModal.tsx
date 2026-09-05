import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OtpLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OtpLoginModal: React.FC<OtpLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendOtp, loginWithOtp, currentUser } = useAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP' | 'SUCCESS'>('PHONE');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setMobileNumber('');
      setOtpDigits(['', '', '', '', '', '']);
      setError(null);
      setDemoOtpNotice(null);
      setCountdown(30);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const cleaned = mobileNumber.replace(/[^0-9]/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = sendOtp(cleaned);
      setIsLoading(false);
      if (res.success) {
        setDemoOtpNotice(res.otp || '123456');
        setStep('OTP');
        setCountdown(30);
        // Focus first OTP input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(res.message);
      }
    }, 400);
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^[0-9]?$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError(null);

    // Auto-focus next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasteData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasteData[i] || '';
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasteData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithOtp(mobileNumber, enteredOtp);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(res.message);
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(res.message);
      }
    }, 400);
  };

  const fillDemoOtp = () => {
    if (demoOtpNotice) {
      const digits = demoOtpNotice.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const selectQuickSample = (num: string) => {
    setMobileNumber(num);
  };

  return (
    <div
      id="otp-login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="otp-login-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white relative">
          <button
            id="close-otp-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-500/40 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mobile OTP Sign In</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Sindhanur AC-58 Constituency Portal
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === 'PHONE' && (
            <div>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Enter your 10-digit registered mobile number to receive a one-time
                verification code. Village members and field cadres can directly
                access their assigned records.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp-mobile-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Mobile Number
                  </label>
                  <div className="relative flex rounded-xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all overflow-hidden bg-slate-50/50">
                    <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-300 text-sm font-semibold text-slate-700">
                      🇮🇳 +91
                    </span>
                    <input
                      id="otp-mobile-input"
                      type="tel"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setError(null);
                      }}
                      placeholder="9845012340"
                      className="w-full px-4 py-3 bg-transparent text-slate-900 text-base font-medium tracking-wide placeholder-slate-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="send-otp-submit-btn"
                  type="submit"
                  disabled={isLoading || mobileNumber.length !== 10}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/20"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick test numbers */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Quick Demo Mobile Numbers:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => selectQuickSample('9845012340')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-left border border-slate-200 transition-colors"
                  >
                    <div className="font-semibold text-slate-800 truncate">Ramesh Patil</div>
                    <div className="text-[11px] text-slate-500">Alabanoor Member</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickSample('9448023450')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-left border border-slate-200 transition-colors"
                  >
                    <div className="font-semibold text-slate-800 truncate">Mallikarjun B.</div>
                    <div className="text-[11px] text-slate-500">Badarli Booth Lead</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'OTP' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Verification Code Sent
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    +91 {mobileNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline underline-offset-2"
                >
                  Change
                </button>
              </div>

              {/* Demo Helper Banner */}
              {demoOtpNotice && (
                <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs text-emerald-800 font-medium">Demo SMS Code: </span>
                      <strong className="text-xs font-mono font-bold text-emerald-900 tracking-wider">
                        {demoOtpNotice}
                      </strong>
                    </div>
                  </div>
                  <button
                    id="auto-fill-otp-btn"
                    type="button"
                    onClick={fillDemoOtp}
                    className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit OTP
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        id={`otp-digit-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className="w-11 h-12 text-center text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all text-slate-900"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="verify-otp-submit-btn"
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length < 6}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/20"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Access Portal</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="font-medium text-slate-400">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      id="resend-otp-btn"
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                OTP Verified Successfully!
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {successMessage || 'Welcome! Loading your constituency profile...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
