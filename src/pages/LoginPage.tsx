import { useState, useEffect } from 'react'
import { auth, googleProvider } from '../firebase'
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    browserPopupRedirectResolver
} from 'firebase/auth'
import { Sprout, Lock } from 'lucide-react'

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getRedirectResult(auth)
            .then(result => {
                if (result?.user) {
                    // login สำเร็จ App.tsx จัดการเอง
                }
            })
            .catch(() => {
                setError('เข้าสู่ระบบไม่สำเร็จ ลองใหม่นะครับ')
            })
    }, [])

    async function handleGoogle() {
        setLoading(true)
        setError('')
        try {
            await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
        } catch (e: unknown) {
            const code = (e as { code?: string }).code
            if (
                code === 'auth/popup-blocked' ||
                code === 'auth/popup-closed-by-user' ||
                code === 'auth/cancelled-popup-request'
            ) {
                try {
                    await signInWithRedirect(auth, googleProvider, browserPopupRedirectResolver)
                } catch {
                    setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองใหม่นะครับ')
                    setLoading(false)
                }
            } else {
                setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองใหม่นะครับ')
                setLoading(false)
            }
        }
    }

    async function handleEmail() {
        if (!email || !password) return setError('กรุณากรอก email และ password ครับ')
        if (password.length < 6) return setError('password ต้องมีอย่างน้อย 6 ตัวอักษรครับ')
        setLoading(true)
        setError('')
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password)
            } else {
                await signInWithEmailAndPassword(auth, email, password)
            }
        } catch (e: unknown) {
            const code = (e as { code?: string }).code
            if (code === 'auth/user-not-found') setError('ไม่พบบัญชีนี้ครับ')
            else if (code === 'auth/wrong-password') setError('รหัสผ่านไม่ถูกต้องครับ')
            else if (code === 'auth/email-already-in-use') setError('Email นี้ถูกใช้แล้วครับ')
            else setError('เกิดข้อผิดพลาด ลองใหม่นะครับ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f5f0eb] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-green-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-yellow-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-40 h-40 bg-green-50/60 rounded-full blur-2xl pointer-events-none" />

            {/* Logo */}
            <div className="text-center mb-8 animate-step-1">
                <div className="w-20 h-20 bg-[#2d5a27] rounded-[28px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-900/20">
                    <Sprout size={38} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-[#2d5a27] tracking-tight">MindBloom</h1>
                <p className="text-gray-400 text-sm mt-1">ดูแลสุขภาพจิตของคุณ</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-xl shadow-gray-200/80 animate-step-2">
                <h2 className="font-bold text-gray-800 text-xl mb-6 text-center">
                    {isRegister ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับ'}
                </h2>

                {/* Google Button */}
                <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border-2 border-gray-100 rounded-2xl py-3.5 mb-5 hover:border-gray-200 hover:shadow-md active:scale-[0.98] transition-all duration-200 bg-white disabled:opacity-60"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">
                        {isRegister ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
                    </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300 font-medium">หรือ</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Email / Password */}
                <div className="space-y-3 mb-5">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEmail() }}
                        className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm outline-none text-gray-700 placeholder:text-gray-300 border border-transparent focus:border-green-200 focus:bg-white transition-all duration-200"
                    />
                    <input
                        type="password"
                        placeholder={isRegister ? 'Password (อย่างน้อย 6 ตัว)' : 'Password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEmail() }}
                        className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm outline-none text-gray-700 placeholder:text-gray-300 border border-transparent focus:border-green-200 focus:bg-white transition-all duration-200"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 rounded-xl px-4 py-2.5 mb-4">
                        <p className="text-red-500 text-xs text-center">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleEmail}
                    disabled={loading}
                    className="w-full bg-[#2d5a27] hover:bg-[#1e3d1a] active:scale-[0.98] text-white rounded-2xl py-3.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 shadow-sm"
                >
                    {loading ? 'กำลังโหลด...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                </button>

                {/* Switch link with animated underline */}
                <div className="text-center mt-5">
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError('') }}
                        className="group text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        {isRegister ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
                        <span className="text-[#2d5a27] font-semibold relative inline-block">
                            {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#2d5a27] transition-all duration-300 ease-out group-hover:w-full" />
                        </span>
                    </button>
                </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 mt-6 animate-step-3">
                <Lock size={11} className="text-gray-300" />
                <p className="text-xs text-gray-300">ข้อมูลของคุณปลอดภัยและเป็นส่วนตัว</p>
            </div>
        </div>
    )
}
