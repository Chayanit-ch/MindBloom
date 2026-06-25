import type { DailyRecord, AssessmentRecord } from '../types'
import { EMOTIONS, EMOTION_ICON } from '../types/emotions'
import * as LucideIcons from 'lucide-react'
import { TrendingUp, MessageCircle, ArrowLeft, Send, AlertTriangle, Phone, ClipboardList, History, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getCopingSuggestion } from '../hooks/useGemini'
import Topbar from '../components/Topbar'
import type { BuddyState } from '../types'
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db, auth } from '../firebase'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const NOW_TIME = Date.now()

interface InsightsPageProps {
    records: DailyRecord[]
    buddy: BuddyState
    lang: 'th' | 'en'
    onToggleLang: () => void
    isAdmin?: boolean
    onOpenAdmin?: () => void
}

interface Message {
    role: 'user' | 'ai'
    text: string
}

function DynIcon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
    const icons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>
    const Icon = icons[name]
    if (!Icon) return null
    return <Icon size={size} className={className} />
}

const PHQ9_QUESTIONS_TH = [
    'เบื่อ ทำอะไร ๆ ก็ไม่เพลิดเพลิน',
    'ไม่สบายใจ ซึมเศร้า หรือท้อแท้',
    'หลับยาก หรือหลับ ๆ ตื่น ๆ หรือหลับมากไป',
    'เหนื่อยง่าย หรือไม่ค่อยมีแรง',
    'เบื่ออาหาร หรือกินมากเกินไป',
    'รู้สึกไม่ดีกับตัวเอง คิดว่าตัวเองล้มเหลว หรือเป็นคนทำให้ตัวเอง หรือครอบครัวผิดหวัง',
    'สมาธิไม่ดีเวลาทำอะไร เช่น ดูโทรทัศน์ ฟังวิทยุ หรือทำงานท่ีต้องใช้ความตั้งใจ',
    'พูดหรือทำอะไรช้าจนคนอื่นมองเห็น หรือกระสับกระส่ายจนท่านอยู่ไม่นิ่งเหมือนเคย',
    'คิดทำร้ายตนเอง หรือคิดว่าถ้าตาย ๆ ไปเสียคงจะดี',
]
const PHQ9_QUESTIONS_EN = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading or watching television',
    'Moving or speaking so slowly that others could notice — or being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself in some way',
]

const PSS10_QUESTIONS_TH = [
    'รู้สึกหงุดหงิดเพราะมีเรื่องที่เกิดขึ้นโดยไม่คาดคิด',
    'รู้สึกว่าไม่สามารถจัดการชีวิตหรือไม่สามารถควบคุมสิ่งสำคัญในชีวิตได้',
    'รู้สึกกังวลกระสับกระส่ายและเครียด',
    'รู้สึกมั่นใจในความสามารถของตัวเองในการจัดการปัญหาได้ดี',
    'รู้สึกว่าสิ่งต่าง ๆ ดำเนินไปตามทิศทางที่ต้องการ',
    'รู้สึกไม่สามารถรับมือกับสิ่งที่ต้องทำได้',
    'สามารถควบคุมความหงุดหงิดในชีวิตได้',
    'รู้สึกว่าตัวเองสามารถควบคุมทุกสถานการณ์ได้',
    'โกรธเพราะสิ่งต่าง ๆ อยู่นอกเหนือการควบคุม',
    'รู้สึกว่าปัญหาต่าง ๆ สะสมจนเกินกว่าจะรับมือหรือเอาชนะได้',
]
const PSS10_QUESTIONS_EN = [
    'Been upset because of something that happened unexpectedly?',
    'Felt unable to control the important things in your life?',
    'Felt nervous and stressed?',
    'Felt confident about your ability to handle personal problems?',
    'Felt that things were going your way?',
    'Found that you could not cope with all the things you had to do?',
    'Been able to control irritations in your life?',
    'Felt that you were on top of things?',
    'Been angered because of things outside of your control?',
    'Felt difficulties were piling up so high that you could not overcome them?',
]

const GAD7_QUESTIONS_TH = [
    'รู้สึกตึงเครียด วิตกกังวลหรือกระวนกระวาย',
    'ไม่สามารถหยุดหรือควบคุมความกังวลได้',
    'กังวลมากเกินไปในเรื่องต่าง ๆ',
    'ทำตัวให้ผ่อนคลายได้ยาก',
    'ท่านรู้สึกกระสับกระส่ายจนไม่สามารถนั่งนิ่ง ๆ ได้',
    'กลายเป็นคนขี้รำคาญ หรือ หงุดหงิดง่าย',
    'รู้สึกกลัวเหมือนกับว่าจะอะไรร้าย ๆ เกิดขึ้น',
]
const GAD7_QUESTIONS_EN = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it\'s hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
]

const PSS_REVERSE = [3, 4, 6, 7]

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยดูแลสุขภาพจิตที่เป็นมิตร อบอุ่น และเข้าใจวัยรุ่นไทย
ชื่อของคุณคือ "Bloom"
คุณสามารถคุยได้เฉพาะเรื่องต่อไปนี้เท่านั้น:
- อารมณ์ ความรู้สึก ความเครียด และสุขภาพจิต
- วิธีดูแลตัวเองและผ่อนคลายความเครียด
- การให้กำลังใจและรับฟัง
- แนะนำให้พบผู้เชี่ยวชาญเมื่อจำเป็น

ข้อห้ามเด็ดขาด:
- ห้ามวินิจฉัยโรค สั่งยา หรืออ้างตัวเป็นจิตแพทย์
- ห้ามคุยนอกเรื่องสุขภาพจิตโดยเด็ดขาด
- ถ้าผู้ใช้ถามนอกเรื่อง ให้บอกสุภาพว่าคุณช่วยได้เฉพาะเรื่องสุขภาพจิตเท่านั้น

ตอบสั้นกระชับ เป็นกันเอง ใช้ภาษาไทย ไม่เกิน 3-4 ประโยคต่อครั้ง`

function getLocalDateStr(date: Date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function InsightsPage({ records, buddy, lang, onToggleLang, isAdmin, onOpenAdmin }: InsightsPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const isTH = lang === 'th'

    const [aiSuggestion, setAiSuggestion] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [chartView, setChartView] = useState<'week' | 'month'>('week')
    const [showChat, setShowChat] = useState(false)
    const [showCallConfirm, setShowCallConfirm] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: 'สวัสดีครับ ฉันชื่อ Bloom วันนี้รู้สึกยังไงบ้างครับ? พูดคุยได้เลยนะครับ' }
    ])
    const [input, setInput] = useState('')
    const [isChatLoading, setIsChatLoading] = useState(false)

    const [activeTest, setActiveTest] = useState<'phq9' | 'pss10' | 'gad7' | null>(null)
    const [testAnswers, setTestAnswers] = useState<number[]>([])
    const [testResult, setTestResult] = useState<{ score: number; label: string; desc: string; color: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [assessmentHistory, setAssessmentHistory] = useState<AssessmentRecord[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [historyType, setHistoryType] = useState<'PHQ9' | 'GAD7' | 'PSS10'>('PHQ9')

    useEffect(() => {
        const uid = auth.currentUser?.uid
        if (!uid) return
        const load = async () => {
            const q = query(collection(db, 'users', uid, 'assessments'), orderBy('timestamp', 'desc'))
            const snap = await getDocs(q)
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentRecord))
            setAssessmentHistory(data)
        }
        load()
    }, [])

    async function saveAssessment(score: number, label: string, answers: number[]) {
        const uid = auth.currentUser?.uid
        if (!uid || !activeTest) return
        setIsSaving(true)
        try {
            const typeMap = { phq9: 'PHQ9', gad7: 'GAD7', pss10: 'PSS10' } as const
            const record: Omit<AssessmentRecord, 'id'> = {
                type: typeMap[activeTest],
                score,
                label,
                answers,
                date: getLocalDateStr(),
                timestamp: new Date().getTime(),
            }
            const docRef = await addDoc(collection(db, 'users', uid, 'assessments'), record)
            setAssessmentHistory(prev => [{ id: docRef.id, ...record }, ...prev])
        } catch (e) {
            console.error('save assessment failed', e)
        } finally {
            setIsSaving(false)
        }
    }

    const emotionCount: Record<string, number> = {}
    records.forEach(r => { emotionCount[r.emotion] = (emotionCount[r.emotion] ?? 0) + 1 })
    const topEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]
    const topEmotionData = topEmotion ? EMOTIONS.find(e => e.name === topEmotion[0]) : null
    const topEmotionName = topEmotion?.[0] ?? ''
    const lastRecord = records[records.length - 1]

    useEffect(() => {
        if (!topEmotionName || aiSuggestion) return
        let cancelled = false
        const fetch_ = async () => {
            setIsLoading(true)
            try {
                const text = await getCopingSuggestion(topEmotionName, lastRecord?.topic ?? 'ชีวิตประจำวัน', lastRecord?.stress ?? 5)
                if (!cancelled) setAiSuggestion(text)
            } catch {
                if (!cancelled) setAiSuggestion('ขอบคุณที่แบ่งปันความรู้สึกนะครับ')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetch_()
        return () => { cancelled = true }
    }, [topEmotionName, lastRecord, aiSuggestion])

    const days = chartView === 'week' ? 7 : 30
    const chartData = Array.from({ length: days }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        const dateStr = getLocalDateStr(d)
        const record = records.find(r => r.date === dateStr)
        const dayNamesTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
        const dayNamesEN = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa']
        return {
            day: chartView === 'week' ? (isTH ? dayNamesTH[d.getDay()] : dayNamesEN[d.getDay()]) : String(d.getDate()),
            stress: record?.stress ?? 0,
            hasData: !!record
        }
    })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = canvas.offsetWidth * window.devicePixelRatio
        canvas.height = canvas.offsetHeight * window.devicePixelRatio
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        const pad = 24
        const stepX = (w - pad * 2) / (chartData.length - 1)
        const maxVal = 10

        // Pre-compute pixel coords for data points only
        const pts = chartData
            .map((d, i) => d.hasData
                ? { x: pad + i * stepX, y: h - pad - (d.stress / maxVal) * (h - pad * 2), day: d.day }
                : null
            )
            .filter((p): p is { x: number; y: number; day: string } => p !== null)

        // Not enough data — draw placeholder and bail
        if (pts.length < 2) {
            ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1
            for (let i = 0; i <= 4; i++) {
                const y = pad + (i / 4) * (h - pad * 2)
                ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
            }
            ctx.fillStyle = '#ccc'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
            ctx.fillText(isTH ? 'บันทึกอย่างน้อย 2 วันเพื่อดูกราฟ' : 'Log at least 2 days to see the chart', w / 2, h / 2)
            return
        }

        // Catmull-Rom cardinal spline → smooth bezier curve through points
        const smoothPath = (points: { x: number; y: number }[], tension = 0.35) => {
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[Math.max(0, i - 1)]
                const p1 = points[i]
                const p2 = points[i + 1]
                const p3 = points[Math.min(points.length - 1, i + 2)]
                ctx.bezierCurveTo(
                    p1.x + (p2.x - p0.x) * tension,
                    p1.y + (p2.y - p0.y) * tension,
                    p2.x - (p3.x - p1.x) * tension,
                    p2.y - (p3.y - p1.y) * tension,
                    p2.x, p2.y
                )
            }
        }

        const draw = (progress: number) => {
            ctx.clearRect(0, 0, w, h)

            // Grid lines (always fully visible)
            ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1
            for (let i = 0; i <= 4; i++) {
                const y = pad + (i / 4) * (h - pad * 2)
                ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
            }

            // Clip region grows left → right as progress 0 → 1
            const clipW = pad + (w - pad) * progress
            ctx.save()
            ctx.beginPath()
            ctx.rect(0, 0, clipW, h)
            ctx.clip()

            // Gradient fill under smooth curve
            const gradient = ctx.createLinearGradient(0, pad, 0, h - pad)
            gradient.addColorStop(0, 'rgba(45, 90, 39, 0.22)')
            gradient.addColorStop(0.55, 'rgba(45, 90, 39, 0.08)')
            gradient.addColorStop(1, 'rgba(45, 90, 39, 0)')
            ctx.beginPath()
            smoothPath(pts)
            ctx.lineTo(pts[pts.length - 1].x, h - pad)
            ctx.lineTo(pts[0].x, h - pad)
            ctx.closePath()
            ctx.fillStyle = gradient
            ctx.fill()

            // Smooth line stroke
            ctx.beginPath()
            ctx.strokeStyle = '#2d5a27'
            ctx.lineWidth = 2.5
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            smoothPath(pts)
            ctx.stroke()

            ctx.restore()

            // Dots drawn outside clip so they appear as full circles at the leading edge
            pts.forEach(p => {
                if (p.x > clipW + 4) return
                ctx.beginPath()
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
                ctx.fillStyle = '#2d5a27'; ctx.fill()
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke()
            })

            // Day labels
            ctx.fillStyle = '#bbb'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
            chartData.forEach((d, i) => {
                if (chartView === 'month' && i % 5 !== 0) return
                ctx.fillText(d.day, pad + i * stepX, h - 4)
            })
        }

        // Animate draw-in over 900 ms with ease-out cubic
        const duration = 900
        let startTime: number | null = null
        let animId = 0
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
        const animate = (ts: number) => {
            if (!startTime) startTime = ts
            const t = Math.min((ts - startTime) / duration, 1)
            draw(easeOut(t))
            if (t < 1) animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animId)
    }, [records, chartView, chartData, isTH])

    const last14 = records.filter(r => NOW_TIME - new Date(r.date).getTime() <= 14 * 24 * 60 * 60 * 1000)
    const negativeEmotions = ['Sad', 'Anxious', 'Angry', 'Hopeless', 'Drained', 'Overwhelmed', 'Scared', 'Worried']
    const negativeDays = last14.filter(r => negativeEmotions.includes(r.emotion)).length

    function getWarningLevel() {
        if (negativeDays >= 10) return {
            color: 'bg-red-50 border-red-200', text: 'text-red-600',
            label: isTH ? 'ควรขอความช่วยเหลือด่วน' : 'Seek Help Soon',
            msg: isTH
                ? 'พบอารมณ์ด้านลบต่อเนื่องนาน ขอแนะนำให้โทรสายด่วน 1323 หรือพบผู้เชี่ยวชาญครับ'
                : 'Prolonged negative emotions detected. Please call hotline 1323 or see a professional.',
        }
        if (negativeDays >= 5) return {
            color: 'bg-orange-50 border-orange-200', text: 'text-orange-600',
            label: isTH ? 'น่าเป็นห่วง' : 'Concerning',
            msg: isTH
                ? 'ช่วงนี้ดูหนักใจมากนะครับ ลองคุยกับครูแนะแนวหรือคนที่ไว้ใจดูนะครับ'
                : "Things seem tough lately. Try talking to a counselor or someone you trust.",
        }
        if (negativeDays >= 3) return {
            color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700',
            label: isTH ? 'เฝ้าระวัง' : 'Watch',
            msg: isTH
                ? 'สังเกตว่าช่วงนี้รู้สึกหนักใจอยู่ ดูแลตัวเองด้วยนะครับ'
                : "Noticed you've been feeling heavy lately. Take care of yourself.",
        }
        return null
    }
    const warning = getWarningLevel()

    const recent7 = records.filter(r => NOW_TIME - new Date(r.date).getTime() <= 7 * 24 * 60 * 60 * 1000)
    const avgStress = recent7.length > 0 ? recent7.reduce((s, r) => s + r.stress, 0) / recent7.length : 0
    const trendLabel = isTH
        ? (avgStress >= 7 ? 'มั่นคง' : avgStress >= 5 ? 'ปานกลาง' : avgStress > 0 ? 'ระวัง' : 'ไม่มีข้อมูล')
        : (avgStress >= 7 ? 'Stable' : avgStress >= 5 ? 'Neutral' : avgStress > 0 ? 'Watch' : 'No Data')

    function startTest(type: 'phq9' | 'pss10' | 'gad7') {
        setActiveTest(type)
        setTestAnswers([])
        setTestResult(null)
    }

    function answerQuestion(score: number) {
        const questions = activeTest === 'phq9'
            ? (isTH ? PHQ9_QUESTIONS_TH : PHQ9_QUESTIONS_EN)
            : activeTest === 'gad7'
                ? (isTH ? GAD7_QUESTIONS_TH : GAD7_QUESTIONS_EN)
                : (isTH ? PSS10_QUESTIONS_TH : PSS10_QUESTIONS_EN)
        const newAnswers = [...testAnswers, score]
        setTestAnswers(newAnswers)
        if (newAnswers.length === questions.length) {
            calculateResult(newAnswers)
        }
    }

    function calculateResult(answers: number[]) {
        let result: { label: string; desc: string; color: string; score: number }
        if (activeTest === 'phq9') {
            const total = answers.reduce((s, v) => s + v, 0)
            const r = total <= 4
                ? { label: isTH ? 'ปกติ' : 'Minimal', desc: isTH ? 'ไม่พบสัญญาณของภาวะซึมเศร้า ดูแลตัวเองต่อไปนะครับ' : 'No signs of depression detected. Keep taking care of yourself!', color: 'text-green-600' }
                : total <= 9
                    ? { label: isTH ? 'ซึมเศร้าเล็กน้อย' : 'Mild Depression', desc: isTH ? 'มีสัญญาณเล็กน้อย ลองพูดคุยกับคนที่ไว้ใจดูนะครับ' : 'Mild signs detected. Consider talking to someone you trust.', color: 'text-yellow-600' }
                    : total <= 14
                        ? { label: isTH ? 'ซึมเศร้าปานกลาง' : 'Moderate Depression', desc: isTH ? 'แนะนำให้พูดคุยกับครูแนะแนวหรือนักจิตวิทยาครับ' : 'Consider speaking with a school counselor or psychologist.', color: 'text-orange-600' }
                        : total <= 19
                            ? { label: isTH ? 'ซึมเศร้าค่อนข้างมาก' : 'Moderately Severe', desc: isTH ? 'ควรพบผู้เชี่ยวชาญด้านสุขภาพจิตครับ โทร 1323 ได้เลย' : 'Please see a mental health professional. Call 1323.', color: 'text-red-500' }
                            : { label: isTH ? 'ซึมเศร้าอย่างรุนแรง' : 'Severe Depression', desc: isTH ? 'กรุณาพบแพทย์หรือโทรสายด่วน 1323 โดยเร็วครับ' : 'Please see a doctor or call hotline 1323 immediately.', color: 'text-red-700' }
            result = { score: total, ...r }
        } else if (activeTest === 'gad7') {
            const total = answers.reduce((s, v) => s + v, 0)
            const r = total <= 4
                ? { label: isTH ? 'ปกติ' : 'Minimal', desc: isTH ? 'ไม่พบสัญญาณของโรควิตกกังวล ดูแลตัวเองต่อไปนะครับ' : 'No signs of anxiety detected. Keep taking care of yourself!', color: 'text-green-600' }
                : total <= 9
                    ? { label: isTH ? 'วิตกกังวลเล็กน้อย' : 'Mild Anxiety', desc: isTH ? 'มีสัญญาณเล็กน้อย ลองฝึกหายใจและผ่อนคลายดูนะครับ' : 'Mild signs. Try breathing exercises and relaxation techniques.', color: 'text-yellow-600' }
                    : total <= 14
                        ? { label: isTH ? 'วิตกกังวลปานกลาง' : 'Moderate Anxiety', desc: isTH ? 'แนะนำให้พูดคุยกับครูแนะแนวหรือนักจิตวิทยาครับ' : 'Consider speaking with a school counselor or psychologist.', color: 'text-orange-600' }
                        : { label: isTH ? 'วิตกกังวลรุนแรง' : 'Severe Anxiety', desc: isTH ? 'ควรพบผู้เชี่ยวชาญด้านสุขภาพจิตโดยเร็วครับ โทร 1323 ได้เลย' : 'Please see a mental health professional soon. Call 1323.', color: 'text-red-600' }
            result = { score: total, ...r }
        } else {
            const total = answers.reduce((s, v, i) => s + (PSS_REVERSE.includes(i) ? 4 - v : v), 0)
            const r = total <= 13
                ? { label: isTH ? 'ความเครียดต่ำ' : 'Low Stress', desc: isTH ? 'ระดับความเครียดอยู่ในเกณฑ์ดีครับ ดูแลตัวเองต่อไปนะ' : 'Stress level is in a good range. Keep it up!', color: 'text-green-600' }
                : total <= 26
                    ? { label: isTH ? 'ความเครียดปานกลาง' : 'Moderate Stress', desc: isTH ? 'มีความเครียดพอสมควร ลองหาวิธีผ่อนคลายดูนะครับ' : 'Moderate stress. Try to find some ways to relax.', color: 'text-yellow-600' }
                    : { label: isTH ? 'ความเครียดสูง' : 'High Stress', desc: isTH ? 'ระดับความเครียดค่อนข้างสูง แนะนำให้คุยกับผู้เชี่ยวชาญครับ' : 'High stress level. Consider speaking with a professional.', color: 'text-red-500' }
            result = { score: total, ...r }
        }
        setTestResult(result)
        saveAssessment(result.score, result.label, answers)
    }

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, showChat])

    async function sendMessage() {
        if (!input.trim() || isChatLoading) return
        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setIsChatLoading(true)
        const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
        let attempts = 0
        while (attempts < 3) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [...history, { role: 'user', parts: [{ text: userMsg }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.8 } }) }
                )
                if (response.status === 429) {
                    attempts++
                    if (attempts < 3) { await new Promise(r => setTimeout(r, attempts * 5000)); continue }
                }
                const data = await response.json()
                setMessages(prev => [...prev, { role: 'ai', text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? (isTH ? 'ขอโทษนะครับ ตอบไม่ได้ชั่วคราว' : 'Sorry, unable to respond right now.') }])
                break
            } catch {
                attempts++
                if (attempts >= 3) setMessages(prev => [...prev, { role: 'ai', text: isTH ? 'ขอโทษนะครับ เน็ตมีปัญหาชั่วคราว' : 'Sorry, connection issue. Please try again.' }])
            }
        }
        setIsChatLoading(false)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const currentQuestions = activeTest === 'phq9'
        ? (isTH ? PHQ9_QUESTIONS_TH : PHQ9_QUESTIONS_EN)
        : activeTest === 'pss10'
            ? (isTH ? PSS10_QUESTIONS_TH : PSS10_QUESTIONS_EN)
            : (isTH ? GAD7_QUESTIONS_TH : GAD7_QUESTIONS_EN)
    const currentQ = currentQuestions[testAnswers.length]
    const testProgress = activeTest ? Math.round((testAnswers.length / currentQuestions.length) * 100) : 0

    const ANSWER_OPTIONS = activeTest === 'pss10'
        ? isTH
            ? [{ label: 'ไม่เลย', value: 0 }, { label: 'เกือบไม่', value: 1 }, { label: 'บางครั้ง', value: 2 }, { label: 'ค่อนข้างบ่อย', value: 3 }, { label: 'บ่อยมาก', value: 4 }]
            : [{ label: 'Never', value: 0 }, { label: 'Almost Never', value: 1 }, { label: 'Sometimes', value: 2 }, { label: 'Fairly Often', value: 3 }, { label: 'Very Often', value: 4 }]
        : isTH
            ? [{ label: 'ไม่มีเลย', value: 0 }, { label: 'บางวัน', value: 1 }, { label: 'บ่อยกว่าครึ่ง', value: 2 }, { label: 'เกือบทุกวัน', value: 3 }]
            : [{ label: 'Not at all', value: 0 }, { label: 'Several days', value: 1 }, { label: 'More than half the days', value: 2 }, { label: 'Nearly every day', value: 3 }]

    const filteredHistory = assessmentHistory.filter(a => a.type === historyType)

    function getTrend(type: 'PHQ9' | 'GAD7' | 'PSS10') {
        const h = assessmentHistory.filter(a => a.type === type)
        if (h.length < 2) return null
        const diff = h[0].score - h[1].score
        if (diff < 0) return { label: isTH ? 'ดีขึ้น' : 'Improved', color: 'text-green-600', icon: 'TrendingDown' }
        if (diff > 0) return { label: isTH ? 'สูงขึ้น' : 'Higher', color: 'text-red-500', icon: 'TrendingUp' }
        return { label: isTH ? 'เท่าเดิม' : 'Same', color: 'text-gray-400', icon: 'Minus' }
    }

    const testLabel = (type: typeof activeTest) => {
        if (type === 'phq9') return isTH ? 'PHQ-9 ประเมินภาวะซึมเศร้า' : 'PHQ-9 Depression Assessment'
        if (type === 'gad7') return isTH ? 'GAD-7 ประเมินโรควิตกกังวล' : 'GAD-7 Anxiety Assessment'
        return isTH ? 'PSS-10 ประเมินความเครียด' : 'PSS-10 Stress Assessment'
    }

    return (
        <div className="pt-4">
            <Topbar buddy={buddy} lang={lang} onToggleLang={onToggleLang} isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} />

            <div className="animate-step-1 mb-5">
                <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">
                    {isTH ? 'สะท้อนความรู้สึก' : 'WEEKLY REFLECTIONS'}
                </p>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    {isTH
                        ? <>ดูแลใจ<span className="text-green-700 italic">อย่างอ่อนโยน</span></>
                        : <>Gentle <span className="text-green-700 italic">Clarity</span> for your Mind.</>
                    }
                </h1>
                <p className="text-gray-400 text-sm">
                    {isTH ? 'ทบทวนอารมณ์และความรู้สึกของสัปดาห์นี้' : "Review this week's emotions and feelings."}
                </p>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-50 animate-step-2">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="font-bold text-gray-800">{isTH ? 'แนวโน้มอารมณ์' : 'Mood Trends'}</h3>
                        <p className="text-xs text-gray-400">{isTH ? 'แนวโน้มอารมณ์ของคุณ' : 'Your emotional ebb and flow'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5">
                        <TrendingUp size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">{trendLabel}</span>
                    </div>
                </div>
                <div className="flex gap-2 mb-3">
                    <button onClick={() => setChartView('week')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === 'week' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {isTH ? '7 วัน' : '7 Days'}
                    </button>
                    <button onClick={() => setChartView('month')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === 'month' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {isTH ? '30 วัน' : '30 Days'}
                    </button>
                </div>
                <canvas ref={canvasRef} className="w-full" style={{ height: '160px' }} />
            </div>

            {/* AI Companion */}
            {topEmotion && (
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-50 animate-step-3">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs text-gray-400 font-bold tracking-widest">{isTH ? 'AI คู่หู' : 'AI COMPANION'}</p>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-100">
                            {isTH ? `ซิงค์: ${topEmotion[0]}` : `Synced: ${topEmotion[0]}`}
                        </span>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                            {topEmotionData
                                ? <DynIcon name={topEmotionData.icon} size={20} className={topEmotionData.iconColor} />
                                : <DynIcon name={EMOTION_ICON[topEmotionName]?.icon ?? 'Smile'} size={20} className={EMOTION_ICON[topEmotionName]?.color ?? 'text-gray-400'} />
                            }
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{isTH ? 'ข้อคิดสำหรับวันนี้' : 'A Thought for You'}</p>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed italic">
                                {isLoading
                                    ? <span className="text-gray-300">{isTH ? 'กำลังคิดคำแนะนำให้...' : 'Thinking of a suggestion...'}</span>
                                    : `"${aiSuggestion}"`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Button */}
            <button
                onClick={() => setShowChat(true)}
                className="w-full bg-[#2d5a27] hover:bg-[#1e3d1a] active:scale-95 text-white rounded-2xl p-4 mb-4 flex items-center justify-between transition-all shadow-sm animate-step-3"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <LucideIcons.Sprout size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm">{isTH ? 'พูดคุยกับ Bloom' : 'Chat with Bloom'}</p>
                        <p className="text-white/60 text-xs">{isTH ? 'AI ผู้ช่วยดูแลสุขภาพจิต' : 'Your AI mental wellness companion'}</p>
                    </div>
                </div>
                <MessageCircle size={20} className="text-white/70" />
            </button>

            {/* Early Warning */}
            {warning && (
                <div className={`border rounded-2xl p-4 mb-4 animate-step-4 ${warning.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={15} className={warning.text} />
                        <p className={`font-bold text-sm ${warning.text}`}>{warning.label}</p>
                    </div>
                    <p className="text-sm text-gray-600">{warning.msg}</p>
                </div>
            )}

            {/* Assessment */}
            <div className="mb-4 animate-step-4">
                <h2 className="text-base font-bold text-gray-800 mb-1">
                    {isTH ? 'แบบประเมินสุขภาพจิต' : 'Mental Health Assessments'}
                </h2>
                <p className="text-xs text-gray-400 mb-3">
                    {isTH
                        ? 'ทำเมื่อไหรก็ได้ ผลเป็นเพียงแนวทาง ไม่ใช่การวินิจฉัยทางการแพทย์'
                        : 'Take anytime. Results are guidelines only — not medical diagnoses.'}
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                    {([
                        { key: 'phq9', label: 'PHQ-9', sub: isTH ? 'ประเมินภาวะซึมเศร้า' : 'Depression', color: 'hover:border-green-200 hover:bg-green-50', iconColor: 'text-green-600', count: isTH ? '9 ข้อ' : '9 items' },
                        { key: 'gad7', label: 'GAD-7', sub: isTH ? 'ประเมินโรควิตกกังวล' : 'Anxiety', color: 'hover:border-orange-200 hover:bg-orange-50', iconColor: 'text-orange-500', count: isTH ? '7 ข้อ' : '7 items' },
                        { key: 'pss10', label: 'PSS-10', sub: isTH ? 'ประเมินระดับความเครียด' : 'Stress', color: 'hover:border-purple-200 hover:bg-purple-50', iconColor: 'text-purple-600', count: isTH ? '10 ข้อ' : '10 items' },
                    ] as const).map(t => {
                        const trend = getTrend(t.key === 'phq9' ? 'PHQ9' : t.key === 'gad7' ? 'GAD7' : 'PSS10')
                        return (
                            <button key={t.key} onClick={() => startTest(t.key)}
                                className={`flex-1 min-w-25 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left ${t.color} transition-all`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList size={16} className={t.iconColor} />
                                    <p className="font-bold text-sm text-gray-800">{t.label}</p>
                                </div>
                                <p className="text-xs text-gray-400">{t.sub}</p>
                                <p className="text-xs text-gray-300 mt-1">{t.count} • ~2 {isTH ? 'นาที' : 'min'}</p>
                                {trend && (
                                    <div className={`flex items-center gap-1 mt-2 ${trend.color}`}>
                                        <DynIcon name={trend.icon} size={12} />
                                        <span className="text-xs font-medium">{trend.label}</span>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* History toggle */}
                {assessmentHistory.length > 0 && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between mb-4 hover:bg-gray-50 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <History size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                                {isTH ? 'ประวัติผลการประเมิน' : 'Assessment History'}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {assessmentHistory.length} {isTH ? 'ครั้ง' : 'times'}
                            </span>
                        </div>
                        {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                )}

                {showHistory && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                        <div className="flex gap-2 mb-3">
                            {(['PHQ9', 'GAD7', 'PSS10'] as const).map(t => (
                                <button key={t} onClick={() => setHistoryType(t)}
                                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${historyType === t ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {filteredHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-3">
                                {isTH ? `ยังไม่มีประวัติ ${historyType}` : `No ${historyType} history yet`}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredHistory.slice(0, 5).map((a, idx) => {
                                    const prev = filteredHistory[idx + 1]
                                    const diff = prev ? a.score - prev.score : null
                                    return (
                                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="text-xs text-gray-400">{a.date}</p>
                                                <p className="text-sm font-medium text-gray-700">{a.label}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {diff !== null && (
                                                    <span className={`text-xs font-medium flex items-center gap-0.5 ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        <DynIcon name={diff < 0 ? 'TrendingDown' : diff > 0 ? 'TrendingUp' : 'Minus'} size={12} />
                                                        {diff < 0 ? `${Math.abs(diff)}` : diff > 0 ? `+${diff}` : ''}
                                                    </span>
                                                )}
                                                <span className="text-lg font-bold text-gray-800">{a.score}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Support Circle */}
                <h2 className="text-base font-bold text-gray-800 mb-3">{isTH ? 'แหล่งช่วยเหลือ' : 'Support Circle'}</h2>
                <button
                    onClick={() => setShowCallConfirm(true)}
                    className="w-full bg-[#fde8e8] rounded-2xl p-4 flex items-center gap-4 hover:opacity-90 transition-all mb-6"
                >
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                        <Phone size={20} className="text-red-500" />
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-bold text-gray-800">{isTH ? 'สายด่วนสุขภาพจิต 1323' : 'Mental Health Hotline 1323'}</p>
                        <p className="text-xs text-gray-400">24/7 • {isTH ? 'ไม่เสียค่าใช้จ่าย • ไม่ระบุตัวตน' : 'Free • Anonymous'}</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-500 px-3 py-1.5 rounded-full font-bold">
                        {isTH ? 'โทรเลย' : 'Call Now'}
                    </span>
                </button>

                {/* Call Confirm */}
                {showCallConfirm && createPortal(
                    <>
                        <div className="fixed inset-0 bg-black/40 z-9998" onClick={() => setShowCallConfirm(false)} />
                        <div className="fixed bottom-0 left-0 right-0 z-9999 max-w-sm mx-auto bg-white rounded-t-3xl"
                             style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="p-5 pb-20">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                            <div className="text-center mb-5">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Phone size={28} className="text-red-500" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">{isTH ? 'โทรสายด่วน 1323' : 'Call Hotline 1323'}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {isTH ? 'บริการฟรี 24 ชั่วโมง ไม่ระบุตัวตน' : 'Free 24-hour service, anonymous'}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                                <p className="text-sm text-gray-600 text-center leading-relaxed">
                                    {isTH
                                        ? 'สายด่วนสุขภาพจิตให้บริการโดยกรมสุขภาพจิต มีนักจิตวิทยาและจิตแพทย์คอยรับสาย พร้อมให้คำปรึกษาตลอด 24 ชั่วโมงครับ'
                                        : 'This hotline is operated by the Department of Mental Health. Psychologists and psychiatrists are available 24 hours a day.'}
                                </p>
                            </div>
                            <a href="tel:1323" onClick={() => setShowCallConfirm(false)} className="block w-full bg-[#2d5a27] text-white text-center rounded-2xl py-4 font-bold text-base mb-3">
                                <Phone size={16} className="inline mr-2" />{isTH ? 'โทรเลย — 1323' : 'Call Now — 1323'}
                            </a>
                            <button onClick={() => setShowCallConfirm(false)} className="w-full text-gray-400 text-sm py-2">
                                {isTH ? 'ยกเลิก' : 'Cancel'}
                            </button>
                        </div>
                        </div>
                    </>,
                    document.body
                )}

                {/* Test Popup */}
                {activeTest && createPortal(
                    <>
                        <div className="fixed inset-0 bg-black/40 z-199" />
                        <div
                            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-200 bg-[#f5f0eb] flex flex-col"
                            style={{ height: 'calc(100dvh - 60px)' }}
                        >
                            <div className="bg-white px-5 py-4 shadow-sm shrink-0">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{testLabel(activeTest)}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {testResult
                                                ? (isTH ? 'ผลการประเมิน' : 'Result')
                                                : `${isTH ? 'ข้อ' : 'Q'} ${testAnswers.length + 1} / ${currentQuestions.length}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setActiveTest(null); setTestAnswers([]); setTestResult(null) }}
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                                    >
                                        <LucideIcons.X size={16} />
                                    </button>
                                </div>
                                {!testResult && (
                                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${testProgress}%` }} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-6">
                                {testResult ? (
                                    <div className="text-center">
                                        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
                                            <p className="text-xs text-gray-400 font-bold tracking-widest mb-3">
                                                {isTH ? 'ผลการประเมิน' : 'RESULT'}
                                            </p>
                                            <p className="text-5xl font-bold text-gray-800 mb-2">{testResult.score}</p>
                                            <p className="text-sm text-gray-400 mb-3">
                                                {isTH ? 'คะแนนเต็ม' : 'Max score'} {activeTest === 'phq9' ? 27 : activeTest === 'gad7' ? 21 : 40}
                                            </p>
                                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${testResult.color} bg-gray-50`}>
                                                {testResult.label}
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{testResult.desc}</p>
                                            {isSaving && <p className="text-xs text-gray-400 mt-3">{isTH ? 'กำลังบันทึกผล...' : 'Saving...'}</p>}
                                            {!isSaving && <p className="text-xs text-green-600 mt-3 flex items-center justify-center gap-1"><LucideIcons.CheckCircle size={12} /> {isTH ? 'บันทึกผลแล้ว' : 'Result saved'}</p>}
                                        </div>
                                        <div className="bg-yellow-50 rounded-2xl p-4 mb-4 text-left">
                                            <div className="flex gap-2">
                                                <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-yellow-700 leading-relaxed">
                                                    {isTH
                                                        ? 'ผลการประเมินนี้เป็นเพียงแนวทางเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์ หากมีข้อสงสัยควรพบผู้เชี่ยวชาญด้านสุขภาพจิตครับ'
                                                        : 'This result is a preliminary guideline only, not a medical diagnosis. If in doubt, please consult a mental health professional.'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTest(null); setTestAnswers([]); setTestResult(null) }}
                                            className="w-full bg-[#2d5a27] text-white rounded-2xl py-4 font-bold"
                                        >
                                            {isTH ? 'เสร็จสิ้น' : 'Done'}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 text-center">
                                            <p className="text-base font-medium text-gray-700 leading-relaxed">
                                                {activeTest === 'pss10'
                                                    ? (isTH ? 'ในเดือนที่ผ่านมา คุณ...' : 'In the last month, have you...')
                                                    : (isTH ? 'ใน 2 สัปดาห์ที่ผ่านมา คุณรู้สึกว่า...' : 'Over the last 2 weeks, how often have you been bothered by...')}
                                            </p>
                                            <p className="text-lg font-bold text-gray-800 mt-3 leading-relaxed">{currentQ}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {ANSWER_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => answerQuestion(opt.value)}
                                                    className="w-full bg-white rounded-2xl px-5 py-4 text-left font-medium text-gray-700 shadow-sm hover:bg-green-50 hover:border-green-200 border border-transparent transition-all"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>,
                    document.body
                )}

                {/* Chat Panel — portal to body so parent transform doesn't break fixed positioning */}
                {showChat && createPortal(
                    <div
                        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-200 bg-[#f5f0eb] flex flex-col"
                        style={{ height: 'calc(100dvh - 60px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-4 bg-white shadow-sm shrink-0">
                            <button onClick={() => setShowChat(false)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                                <ArrowLeft size={18} className="text-gray-600" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                                    <LucideIcons.Sprout size={18} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Bloom</p>
                                    <p className="text-xs text-green-600">{isTH ? 'ออนไลน์อยู่' : 'Online'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2 shrink-0">
                            <p className="text-xs text-yellow-700">
                                {isTH
                                    ? 'Bloom เป็นผู้ช่วยเบื้องต้นเท่านั้น ไม่ใช่จิตแพทย์และไม่สามารถวินิจฉัยโรคได้'
                                    : 'Bloom is a preliminary assistant only — not a psychiatrist and cannot diagnose conditions.'}
                            </p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'ai' && (
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2 shrink-0">
                                            <LucideIcons.Sprout size={16} className="text-green-600" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#2d5a27] text-white rounded-tr-sm' : 'bg-white text-gray-700 shadow-sm rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                        <LucideIcons.Sprout size={16} className="text-green-600" />
                                    </div>
                                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                        <div className="flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input — sits just above the navbar */}
                        <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isTH ? 'พิมพ์ความรู้สึกของคุณ...' : 'Type how you feel...'}
                                    className="flex-1 resize-none outline-none text-sm text-gray-700 placeholder:text-gray-300 max-h-24 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
                                    rows={1}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isChatLoading}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${input.trim() && !isChatLoading ? 'bg-[#2d5a27] text-white' : 'bg-gray-100 text-gray-300'}`}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}