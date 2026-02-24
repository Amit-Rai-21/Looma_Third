"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { authAPI } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail, KeyRound, ShieldCheck, Eye } from "lucide-react"

type Step = "login" | "forgot" | "otp" | "reset"

const OTP_SECONDS = 10 * 60  // 10 minutes
const RESEND_SECONDS = 60     // 60 seconds before resend allowed

export function LoginForm() {
  // ── Login state ──────────────────────────────────────────
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, loginAsViewer } = useAuth()

  // ── Forgot password state ────────────────────────────────
  const [step, setStep] = useState<Step>("login")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [stepError, setStepError] = useState("")
  const [stepSuccess, setStepSuccess] = useState("")

  // ── OTP Timer state ──────────────────────────────────────
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_SECONDS)
  const [resendTimeLeft, setResendTimeLeft] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const otpTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null)
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // ── Start OTP timers ─────────────────────────────────────
  const startOtpTimers = () => {
    setOtpTimeLeft(OTP_SECONDS)
    setResendTimeLeft(RESEND_SECONDS)
    setCanResend(false)

    if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    if (resendTimerRef.current) clearInterval(resendTimerRef.current)

    otpTimerRef.current = setInterval(() => {
      setOtpTimeLeft(prev => {
        if (prev <= 1) { clearInterval(otpTimerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)

    resendTimerRef.current = setInterval(() => {
      setResendTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current)
      if (resendTimerRef.current) clearInterval(resendTimerRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // ── Login ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    const success = await login(username, password)
    if (!success) setError("Invalid username or password")
    setIsSubmitting(false)
  }

  // ── Viewer Login ─────────────────────────────────────────
  const handleViewerLogin = () => {
    loginAsViewer()
  }

  // ── Step 1: Send OTP ─────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) { setStepError("Please enter your email"); return }
    setIsSubmitting(true)
    setStepError("")
    try {
      await authAPI.forgotPassword(email)
      setStep("otp")
      startOtpTimers()
      setStepSuccess("OTP sent! Check your email.")
    } catch (e: any) {
      setStepError(e.message || "Failed to send OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: Verify OTP ───────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6) { setStepError("Please enter the 6-digit OTP"); return }
    if (otpTimeLeft === 0) { setStepError("OTP has expired. Please request a new one."); return }
    setIsSubmitting(true)
    setStepError("")
    try {
      await authAPI.verifyOTP(email, otpValue)
      setStep("reset")
      setStepSuccess("")
    } catch (e: any) {
      setStepError(e.message || "Invalid OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 3: Reset Password ───────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { setStepError("Please fill in all fields"); return }
    if (newPassword.length < 6) { setStepError("Password must be at least 6 characters"); return }
    if (newPassword !== confirmPassword) { setStepError("Passwords do not match"); return }
    setIsSubmitting(true)
    setStepError("")
    try {
      await authAPI.resetPassword(email, otp.join(""), newPassword)
      setStepSuccess("Password reset successfully! You can now log in.")
      setStep("login")
      setEmail("")
      setOtp(["", "", "", "", "", ""])
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      setStepError(e.message || "Failed to reset password")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────
  const handleResendOTP = async () => {
    setIsSubmitting(true)
    setStepError("")
    try {
      await authAPI.forgotPassword(email)
      setOtp(["", "", "", "", "", ""])
      startOtpTimers()
      setStepSuccess("New OTP sent!")
    } catch (e: any) {
      setStepError(e.message || "Failed to resend OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── OTP input handlers ───────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpInputsRef.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(""))
      otpInputsRef.current[5]?.focus()
    }
  }

  const goBack = () => {
    setStep(step === "otp" || step === "reset" ? "forgot" : "login")
    setStepError("")
    setStepSuccess("")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="relative h-[38vh] lg:h-[34vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url('/hero-bg.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Looma Education</h1>
          <h2 className="text-lg md:text-2xl font-light mb-3">Education for All in Nepal</h2>
          <p className="text-base text-white/90 max-w-2xl mx-auto">
            Dashboard for managing and monitoring Looma devices across schools
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <Card className="border shadow-xl">
            <CardContent className="p-10">

              {/* ── LOGIN ── */}
              {step === "login" && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Login</h2>
                    <p className="text-gray-600 mt-1">Sign in to manage schools</p>
                  </div>

                  {stepSuccess && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <AlertDescription className="text-green-700">{stepSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        className="h-12"
                        autoComplete="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          onClick={() => { setStep("forgot"); setStepError(""); setStepSuccess("") }}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="h-12"
                        autoComplete="current-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                      ) : "Sign In"}
                    </Button>
                  </form>

                  {/* ── Divider ── */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-400 font-medium">or</span>
                    </div>
                  </div>

                  {/* ── Login as Viewer ── */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all gap-2"
                    onClick={handleViewerLogin}
                  >
                    <Eye className="h-5 w-5" />
                    Continue as Viewer
                  </Button>
                
                </>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {step === "forgot" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={goBack} className="text-gray-500 hover:text-gray-700">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
                      <p className="text-gray-600 text-sm mt-0.5">Enter your registered email to receive OTP</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {stepError && (
                      <Alert variant="destructive">
                        <AlertDescription>{stepError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="h-12 pl-10"
                          onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleForgotPassword}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                      ) : "Send OTP"}
                    </Button>
                  </div>
                </>
              )}

              {/* ── OTP VERIFICATION ── */}
              {step === "otp" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={goBack} className="text-gray-500 hover:text-gray-700">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Enter OTP</h2>
                      <p className="text-gray-600 text-sm mt-0.5">
                        Sent to <span className="font-medium text-gray-800">{email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {stepSuccess && (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-700">{stepSuccess}</AlertDescription>
                      </Alert>
                    )}
                    {stepError && (
                      <Alert variant="destructive">
                        <AlertDescription>{stepError}</AlertDescription>
                      </Alert>
                    )}

                    {/* OTP expiry timer */}
                    <div className={`text-center text-sm font-medium ${otpTimeLeft <= 60 ? "text-red-500" : "text-gray-500"}`}>
                      {otpTimeLeft > 0 ? (
                        <>OTP expires in <span className="font-bold">{formatTime(otpTimeLeft)}</span></>
                      ) : (
                        <span className="text-red-500">OTP has expired. Please resend.</span>
                      )}
                    </div>

                    {/* 6-digit OTP inputs */}
                    <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpInputsRef.current[i] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-xl font-bold border-2 rounded-lg
                                     focus:border-blue-500 focus:outline-none transition-colors
                                     bg-gray-50 text-gray-900"
                        />
                      ))}
                    </div>

                    <Button
                      onClick={handleVerifyOTP}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                      disabled={isSubmitting || otpTimeLeft === 0 || otp.join("").length !== 6}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                      ) : (
                        <><ShieldCheck className="mr-2 h-4 w-4" />Verify OTP</>
                      )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="text-center text-sm text-gray-500">
                      {canResend ? (
                        <button
                          onClick={handleResendOTP}
                          disabled={isSubmitting}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <>Resend OTP in <span className="font-medium">{formatTime(resendTimeLeft)}</span></>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── RESET PASSWORD ── */}
              {step === "reset" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                      <p className="text-gray-600 text-sm mt-0.5">Enter your new password</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {stepError && (
                      <Alert variant="destructive">
                        <AlertDescription>{stepError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="h-12"
                        onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                    </div>

                    {/* Password match indicator */}
                    {confirmPassword && (
                      <p className={`text-xs ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                        {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}

                    <Button
                      onClick={handleResetPassword}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
                      ) : "Reset Password"}
                    </Button>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p className="text-sm">Looma Education - Bringing quality education to Nepal</p>
        <p className="text-xs text-gray-400 mt-1">Tax ID: 84-3424916 | Menlo Park, CA, USA</p>
      </footer>
    </div>
  )
}