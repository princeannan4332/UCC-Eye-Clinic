import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Mail, Lock, User, AlertCircle, CheckCircle, MailCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function AuthPage({ onNavigate }) {
    const { login, completeRegistration } = useAuth();

    // 'login' | 'signup' | 'otp'
    const [mode, setMode] = useState('login');

    // Shared fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // OTP state
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
    const [resendCooldown, setResendCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const otpRefs = useRef([]);
    const countdownRef = useRef(null);
    const resendRef = useRef(null);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Countdown timers ────────────────────────────────────────────────────────
    const startCountdowns = useCallback(() => {
        clearInterval(countdownRef.current);
        clearInterval(resendRef.current);
        setCountdown(600);
        setResendCooldown(60);
        setCanResend(false);

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);

        resendRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(resendRef.current);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        return () => {
            clearInterval(countdownRef.current);
            clearInterval(resendRef.current);
        };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Form Validation ─────────────────────────────────────────────────────────
    const validateForm = () => {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            return 'Please enter a valid email address (e.g. user@gmail.com).';
        }
        if (!cleanPass || cleanPass.length < 4) {
            return 'Password must be at least 4 characters long.';
        }
        if (mode === 'signup') {
            if (!fullName.trim() || fullName.trim().length < 2) {
                return 'Please enter your full name (minimum 2 characters).';
            }
        }
        return null;
    };

    // ── OTP digit input handlers ────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newDigits = [...otpDigits];
        newDigits[index] = digit;
        setOtpDigits(newDigits);
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                const newDigits = [...otpDigits];
                newDigits[index - 1] = '';
                setOtpDigits(newDigits);
                otpRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newDigits = ['', '', '', '', '', ''];
            pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
            setOtpDigits(newDigits);
            const focusIndex = Math.min(pasted.length, 5);
            otpRefs.current[focusIndex]?.focus();
        }
    };

    // ── Submit Handlers ─────────────────────────────────────────────────────────
    const handleLoginOrSignupSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const validationErr = validateForm();
        if (validationErr) { setErrorMsg(validationErr); return; }

        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                const res = await login(email, password);
                if (!res.success) {
                    setErrorMsg(res.error || 'Login failed. Please check your email and password.');
                } else if (res.requiresOtp) {
                    setOtpDigits(['', '', '', '', '', '']);
                    setMode('otp');
                    startCountdowns();
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                } else {
                    if (res.profile?.role === 'admin' || res.profile?.role === 'doctor' || res.profile?.onboarding_completed) {
                        onNavigate('portal');
                    } else {
                        onNavigate('onboarding');
                    }
                }
            } else {
                // Sign up: send OTP email
                const res = await api.sendOtp(email.trim().toLowerCase(), fullName.trim(), password.trim());
                if (res.error) {
                    setErrorMsg(res.error);
                } else {
                    setOtpDigits(['', '', '', '', '', '']);
                    setMode('otp');
                    startCountdowns();
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const code = otpDigits.join('');
        if (code.length < 6) {
            setErrorMsg('Please enter all 6 digits of your verification code.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.verifyOtp(email.trim().toLowerCase(), code);
            if (res.error) {
                setErrorMsg(res.error);
                setOtpDigits(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
            } else {
                completeRegistration(res.profile, res.user);
                clearInterval(countdownRef.current);
                clearInterval(resendRef.current);
                if (res.profile?.role === 'admin' || res.profile?.role === 'doctor' || res.profile?.onboarding_completed) {
                    onNavigate('portal');
                } else {
                    onNavigate('onboarding');
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleResendOtp = async () => {
        if (!canResend) return;
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            const res = await api.sendOtp(email.trim().toLowerCase(), fullName.trim(), password.trim());
            if (res.error) {
                setErrorMsg(res.error);
            } else {
                setOtpDigits(['', '', '', '', '', '']);
                startCountdowns();
                setSuccessMsg('A new verification code has been sent to your email.');
                setTimeout(() => setSuccessMsg(''), 4000);
                otpRefs.current[0]?.focus();
            }
        } catch (err) {
            setErrorMsg('Failed to resend OTP. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchToLogin = () => {
        clearInterval(countdownRef.current);
        clearInterval(resendRef.current);
        setMode('login');
        setErrorMsg('');
        setSuccessMsg('');
        setOtpDigits(['', '', '', '', '', '']);
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F4F7F5] font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">

                {/* ── OTP Verification Screen ── */}
                {mode === 'otp' ? (
                    <>
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="inline-flex w-14 h-14 rounded-2xl bg-[#6FCF97]/20 items-center justify-center mb-1">
                                <MailCheck className="w-7 h-7 text-[#27AE60]" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Verify Your Email
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                A 6-digit code was sent to <span className="font-bold text-slate-700">{email}</span>
                            </p>
                        </div>

                        {/* Error / Success Banners */}
                        {errorMsg && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2.5">
                                <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                                <span className="font-semibold">{successMsg}</span>
                            </div>
                        )}

                        {/* OTP Form */}
                        <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">

                            {/* Digit boxes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-3 text-center">
                                    Enter Verification Code
                                </label>
                                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                    {otpDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => otpRefs.current[i] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className={`w-11 h-13 text-center text-lg font-black rounded-xl border-2 transition-all focus:outline-none
                                                ${digit
                                                    ? 'border-[#27AE60] bg-[#F4F7F5] text-[#27AE60]'
                                                    : 'border-slate-200 bg-slate-50 text-slate-900'
                                                } focus:border-[#6FCF97] focus:bg-white`}
                                            style={{ width: '2.75rem', height: '3.25rem' }}
                                            aria-label={`OTP digit ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-center justify-between text-xs px-1">
                                <span className={`font-semibold ${countdown <= 60 ? 'text-red-500' : 'text-slate-500'}`}>
                                    Code expires in: <span className="font-black">{formatTime(countdown)}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={!canResend || isSubmitting}
                                    className={`flex items-center gap-1 font-bold transition-colors
                                        ${canResend
                                            ? 'text-[#27AE60] hover:text-[#219150] cursor-pointer'
                                            : 'text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
                                </button>
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || otpDigits.join('').length < 6}
                                className="w-full py-3 bg-[#6FCF97] hover:bg-[#52c17d] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center text-xs shadow-xs"
                            >
                                {isSubmitting ? (
                                    <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-4 h-4" />
                                ) : (
                                    'Verify & Create Account'
                                )}
                            </button>
                        </form>

                        {/* Back link */}
                        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <button
                                onClick={switchToLogin}
                                className="flex items-center gap-1.5 mx-auto font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Login
                            </button>
                        </div>
                    </>
                ) : (

                    /* ── Login / Sign Up Screen ── */
                    <>
                        {/* Logo Banner */}
                        <div className="text-center space-y-2">
                            <div className="inline-flex w-12 h-12 rounded-2xl bg-[#6FCF97] items-center justify-center text-slate-900 font-bold mb-1 shadow-xs">
                                <Eye className="w-6 h-6 text-slate-900" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {mode === 'login' ? 'Login' : 'Register Patient Account'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                UCC Eye Clinic Portal
                            </p>
                        </div>

                        {/* Error Banner */}
                        {errorMsg && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLoginOrSignupSubmit} noValidate className="space-y-4">


                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Ama Mensah"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="e.g. patient@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                    

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center text-xs shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-4 h-4" />
                                ) : (
                                    mode === 'login' ? 'Sign In ' : 'Send Verification Code'
                                )}
                            </button>
                        </form>

                        {/* Toggle Login/Signup */}
                        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                            {mode === 'login' ? (
                                <p>
                                    Don&apos;t have an account yet?{' '}
                                    <button
                                        onClick={() => { setMode('signup'); setErrorMsg(''); }}
                                        className="font-bold text-[#27AE60] hover:underline cursor-pointer"
                                    >
                                        Register Patient Account
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already registered?{' '}
                                    <button
                                        onClick={() => { setMode('login'); setErrorMsg(''); }}
                                        className="font-bold text-[#27AE60] hover:underline cursor-pointer"
                                    >
                                        Sign In
                                    </button>
                                </p>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

