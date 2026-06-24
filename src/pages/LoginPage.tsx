import { useState } from 'react'
import { auth, googleProvider } from '../firebase'
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    browserPopupRedirectResolver
} from 'firebase/auth'
import { useEffect } from 'react'

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
            // ลอง popup ก่อน
            await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
        } catch (e: unknown) {
            const code = (e as { code?: string }).code
            // ถ้า popup ถูกบล็อก (Safari) → ใช้ redirect แทน
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
        <div className="min-h-screen bg-[#f5f0eb] flex flex-col items-center justify-center px-6">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-3">🌱</div>
                <h1 className="text-3xl font-bold text-[#2d5a27]">MindBloom</h1>
                <p className="text-gray-400 text-sm mt-1">My Sanctuary</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-700 text-lg mb-4">
                    {isRegister ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
                </h2>

                {/* Google */}
                <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3 mb-4 hover:bg-gray-50 transition-all"
                >
                    <span className="text-xl">G</span>
                    <span className="text-sm font-medium text-gray-600">
                        {isRegister ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
                    </span>
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300">หรือ</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Email */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none mb-3 text-gray-700 placeholder:text-gray-300"
                />
                <input
                    type="password"
                    placeholder="Password (อย่างน้อย 6 ตัว)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none mb-4 text-gray-700 placeholder:text-gray-300"
                />

                {error && (
                    <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
                )}

                <button
                    onClick={handleEmail}
                    disabled={loading}
                    className="w-full bg-[#2d5a27] text-white rounded-2xl py-3 text-sm font-bold hover:bg-[#1e3d1a] transition-all disabled:opacity-50"
                >
                    {loading ? 'กำลังโหลด...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                </button>

                <button
                    onClick={() => { setIsRegister(!isRegister); setError('') }}
                    className="w-full text-center text-xs text-gray-400 mt-4 hover:text-gray-600"
                >
                    {isRegister ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
                </button>
            </div>

            <p className="text-xs text-gray-300 mt-6 text-center">
                ข้อมูลของคุณปลอดภัยและเป็นส่วนตัว 🔒
            </p>
        </div>
    )
}