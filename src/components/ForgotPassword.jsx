import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, RefreshCw, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

// OTP Input Component - Brutalist 6-digit boxes
function OTPInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  
  const handleChange = (index, digit) => {
    if (digit.length > 1) digit = digit.slice(-1);
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    const newString = newValue.join('');
    onChange(newString);
    
    // Auto-focus next
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black border-4 border-black bg-neo-white shadow-neo-sm focus:bg-neo-accent focus:outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export default function ForgotPassword({ onBack, onSuccess }) {
  const [step, setStep] = useState('request'); // request, otp, reset, success
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  
  // Countdown for resend
  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);
  
  const requestOTP = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetToken(data.resetToken);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['request', 'otp', 'reset', 'success'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`h-3 w-3 border-2 border-black ${
              ['request', 'otp', 'reset', 'success'].indexOf(step) >= i 
                ? 'bg-neo-accent' 
                : 'bg-neo-muted'
            }`} />
            {i < 3 && (
              <div className={`w-8 h-1 border-y-2 border-black ${
                ['request', 'otp', 'reset', 'success'].indexOf(step) > i 
                  ? 'bg-neo-accent' 
                  : 'bg-neo-muted'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Request OTP */}
      {step === 'request' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-4 border-black bg-neo-white p-6 shadow-neo-lg"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4 hover:text-neo-accent transition-colors"
          >
            <ArrowLeft className="size-4 stroke-[3px]" />
            Back to Login
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-neo-accent shadow-neo-sm">
              <Mail className="size-6 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Forgot Password</h2>
              <p className="text-xs font-bold opacity-70">We'll send you an OTP</p>
            </div>
          </div>

          <form onSubmit={requestOTP} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.3em]">Username</Label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-14 rounded-none border-4 border-black bg-white text-base font-bold focus-visible:bg-neo-secondary"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold">
                <AlertCircle className="size-4 stroke-[3px]" />
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading || !username.trim()}
              className="h-14 w-full rounded-none border-4 border-black bg-neo-accent text-sm font-black uppercase tracking-widest shadow-neo-md"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>
        </motion.div>
      )}

      {/* Step 2: Enter OTP */}
      {step === 'otp' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-4 border-black bg-neo-white p-6 shadow-neo-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-neo-secondary shadow-neo-sm">
              <KeyRound className="size-6 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Enter OTP</h2>
              <p className="text-xs font-bold opacity-70">Sent to your registered email</p>
            </div>
          </div>

          <form onSubmit={verifyOTP} className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-[0.3em]">6-Digit Code</Label>
              <OTPInput value={otp} onChange={setOtp} disabled={loading} />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold">
                <AlertCircle className="size-4 stroke-[3px]" />
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resendOTP}
                disabled={resendTimer > 0 || loading}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:text-neo-accent transition-colors"
              >
                <RefreshCw className={`size-4 stroke-[3px] ${loading ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
            
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="h-14 w-full rounded-none border-4 border-black bg-neo-accent text-sm font-black uppercase tracking-widest shadow-neo-md"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </motion.div>
      )}

      {/* Step 3: Reset Password */}
      {step === 'reset' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-4 border-black bg-neo-white p-6 shadow-neo-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-neo-accent shadow-neo-sm">
              <Lock className="size-6 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">New Password</h2>
              <p className="text-xs font-bold opacity-70">Set a strong password</p>
            </div>
          </div>

          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.3em]">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 rounded-none border-4 border-black bg-white pr-12 text-base font-bold focus-visible:bg-neo-secondary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="size-5 stroke-[3px]" />
                  ) : (
                    <Eye className="size-5 stroke-[3px]" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.3em]">Confirm Password</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-14 rounded-none border-4 border-black bg-white text-base font-bold focus-visible:bg-neo-secondary"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold">
                <AlertCircle className="size-4 stroke-[3px]" />
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="h-14 w-full rounded-none border-4 border-black bg-neo-accent text-sm font-black uppercase tracking-widest shadow-neo-md"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </motion.div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-4 border-black bg-neo-secondary p-6 shadow-neo-lg text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center border-4 border-black bg-neo-white shadow-neo-md">
              <CheckCircle2 className="size-8 stroke-[3px] text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Success!</h2>
          <p className="text-sm font-bold mb-6">Your password has been reset.</p>
          <Button
            onClick={onSuccess}
            className="h-14 w-full rounded-none border-4 border-black bg-neo-accent text-sm font-black uppercase tracking-widest shadow-neo-md"
          >
            Back to Login
          </Button>
        </motion.div>
      )}
    </div>
  );
}
