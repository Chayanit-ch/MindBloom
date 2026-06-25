import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { DailyRecord } from '../types'
import { ChevronLeft, ChevronRight, Lock, X, Calendar, TrendingUp, TrendingDown, Sprout } from 'lucide-react'
import Topbar from '../components/Topbar'
import type { BuddyState } from '../types'
import { EMOTIONS, EMOTION_ICON, WEATHER_ICON } from '../types/emotions'
import * as LucideIcons from 'lucide-react'

interface HistoryPageProps {
    records: DailyRecord[]
    buddy: BuddyState
    lang: 'th' | 'en'
    onToggleLang: () => void
    isAdmin?: boolean
    onOpenAdmin?: () => void
}

const MONTH_NAMES_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
const DAY_NAMES_EN = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']

const LOCK_DURATION = 7 * 24 * 60 * 60 * 1000

function getLucideIcon(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (LucideIcons as any)[name] as React.FC<{ size?: number; className?: string }> | undefined
}

function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(dateStr: string, lang: 'th' | 'en') {
    return new Date(dateStr).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' })
}
function getRemainingTime(unlockTime: number, nowTime: number, isTH: boolean) {
    const remaining = unlockTime - nowTime
    if (remaining <= 0) return null
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return isTH ? `${days} วัน ${hours} ชั่วโมง` : `${days}d ${hours}h`
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${String(hours).padStart(2, '0')}H ${String(mins).padStart(2, '0')}M`
}
function isReady(record: DailyRecord, nowTime: number) {
    return nowTime - record.timestamp >= LOCK_DURATION
}

function getWeatherIcon(emotionName: string): { icon: string; color: string } {
    const found = EMOTIONS.find(e => e.name === emotionName)
    if (found) return { icon: found.weatherIcon, color: 'text-yellow-400' }
    const negative = ['Sad', 'Hopeless', 'Drained', 'Overwhelmed', 'Lonely', 'Scared', 'Worried', 'Discouraged', 'Disappointed', 'Ashamed', 'Guilty', 'Embarrassed']
    const veryNeg = ['Angry', 'Anxious', 'Frustrated', 'Irritated', 'Annoyed', 'Stressed']
    const positive = ['Happy', 'Joyful', 'Excited', 'Grateful', 'Proud', 'Amazed', 'Amused', 'Brave', 'Confident', 'Content', 'Hopeful', 'Passionate', 'Relieved', 'Satisfied']
    if (veryNeg.includes(emotionName)) return { icon: 'CloudLightning', color: 'text-purple-500' }
    if (negative.includes(emotionName)) return { icon: 'CloudRain', color: 'text-blue-400' }
    if (positive.includes(emotionName)) return { icon: 'Sun', color: 'text-yellow-400' }
    return { icon: 'Cloud', color: 'text-gray-400' }
}

function getEmotionIcon(emotionName: string): { icon: string; color: string } {
    return EMOTION_ICON[emotionName] ?? { icon: 'Smile', color: 'text-gray-400' }
}

export default function HistoryPage({ records, buddy, lang, onToggleLang, isAdmin, onOpenAdmin }: HistoryPageProps) {
    const nowTime = useMemo(() => new Date().getTime(), [])
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth())
    const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null)

    const isTH = lang === 'th'
    const MONTH_NAMES = isTH ? MONTH_NAMES_TH : MONTH_NAMES_EN
    const DAY_NAMES = isTH ? DAY_NAMES_TH : DAY_NAMES_EN

    const recordMap: Record<string, DailyRecord> = {}
        ;[...records]
            .sort((a, b) => a.timestamp - b.timestamp)
            .forEach(r => { recordMap[r.date] = r })

    function changeMonth(dir: number) {
        let m = month + dir
        let y = year
        if (m > 11) { m = 0; y++ }
        if (m < 0) { m = 11; y-- }
        setMonth(m); setYear(y)
    }

    const firstDay = new Date(year, month, 1).getDay()
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const positiveEmotions = ['Happy', 'Calm', 'Excited', 'Grateful', 'Joyful', 'Content', 'Peaceful']
    const thisWeek = records.filter(r => nowTime - new Date(r.date).getTime() <= 7 * 24 * 60 * 60 * 1000)
    const lastWeek = records.filter(r => {
        const diff = nowTime - new Date(r.date).getTime()
        return diff > 7 * 24 * 60 * 60 * 1000 && diff <= 14 * 24 * 60 * 60 * 1000
    })
    const thisSunny = thisWeek.filter(r => positiveEmotions.includes(r.emotion)).length
    const lastSunny = lastWeek.filter(r => positiveEmotions.includes(r.emotion)).length
    const sunnyDiff = lastSunny > 0
        ? Math.round(((thisSunny - lastSunny) / lastSunny) * 100)
        : thisSunny > 0 ? 100 : 0

    const nextMilestone = [7, 14, 30, 60, 100].find(m => buddy.streak < m) ?? 100
    const daysLeft = nextMilestone - buddy.streak

    const calendarTitle = isTH ? `${MONTH_NAMES[month]} ${year + 543}` : `${MONTH_NAMES[month]} ${year}`

    return (
        <div className="pt-4">
            <Topbar buddy={buddy} lang={lang} onToggleLang={onToggleLang} isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} />

            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {isTH ? 'ประวัติอารมณ์' : 'Mood History'}
            </h1>
            <p className="text-gray-400 text-sm mb-4">
                {isTH ? 'ย้อนดูอารมณ์ผ่านฤดูกาลของสวน' : 'Track your emotions through the seasons'}
            </p>

            {/* Calendar */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-step-1">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl hover:bg-gray-100 active:scale-90 transition-all duration-150">
                        <ChevronLeft size={20} className="text-gray-400" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-700">{calendarTitle}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-xl hover:bg-gray-100 active:scale-90 transition-all duration-150">
                        <ChevronRight size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-gray-300 py-1">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: adjustedFirst }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const d = i + 1
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                        const record = recordMap[dateStr]
                        const isToday = dateStr === todayStr
                        return (
                            <button
                                key={dateStr}
                                onClick={() => record && setSelectedRecord(record)}
                                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all duration-200 ${isToday ? 'ring-2 ring-green-500' : ''} ${record ? 'hover:bg-green-50 hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                            >
                                {record ? (
                                    <>
                                        <span className="leading-none">{(() => {
                                            const w = getWeatherIcon(record.emotion)
                                            const Icon = getLucideIcon(w.icon)
                                            return Icon ? <Icon size={17} className={w.color} /> : null
                                        })()}</span>
                                        <span className="text-gray-400 mt-0.5 text-[10px]">{d}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-300 text-[11px]">{d}</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Weekly Growth */}
            <div className={`rounded-2xl p-4 mb-3 animate-step-2 ${sunnyDiff >= 0 ? 'bg-[#e8f0e8]' : 'bg-[#fde8e8]'}`}>
                <div className="flex items-center gap-2 mb-1">
                    {sunnyDiff >= 0
                        ? <TrendingUp size={18} className="text-green-600" />
                        : <TrendingDown size={18} className="text-red-500" />}
                    <h3 className="font-bold text-gray-800">{isTH ? 'การเติบโตประจำสัปดาห์' : 'Weekly Growth'}</h3>
                </div>
                <p className="text-sm text-gray-600">
                    {sunnyDiff >= 0
                        ? isTH
                            ? `คุณมีวันที่ดีเพิ่มขึ้น ${sunnyDiff}% จากสัปดาห์ที่แล้ว`
                            : `Good days increased by ${sunnyDiff}% from last week`
                        : isTH
                            ? 'สัปดาห์นี้ยากขึ้นนิดนึง ไม่เป็นไรนะครับ'
                            : "This week was a bit tough — that's okay"
                    }
                </p>
            </div>

            {/* Next Milestone */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow duration-200 animate-step-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <Sprout size={20} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                    {isTH
                        ? <>อีก <span className="font-bold text-green-700">{daysLeft} วัน</span> ถึงเป้าหมายถัดไป</>
                        : <>Next milestone in <span className="font-bold text-green-700">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span></>
                    }
                </p>
            </div>

            {/* Popup Overlay */}
            {selectedRecord && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/40 z-9998" onClick={() => setSelectedRecord(null)} />
                    <div className="fixed bottom-0 left-0 right-0 z-9999 max-w-sm mx-auto bg-white rounded-t-3xl"
                         style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <div className="p-5 pb-20">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isReady(selectedRecord, nowTime) ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    {isReady(selectedRecord, nowTime) ? (() => {
                                        const e = getEmotionIcon(selectedRecord.emotion)
                                        const Icon = getLucideIcon(e.icon)
                                        return Icon ? <Icon size={24} className={e.color} /> : null
                                    })() : <Lock size={20} className="text-gray-400" />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-base">{selectedRecord.emotion}</p>
                                    <p className="text-xs text-gray-400">
                                        {formatDate(selectedRecord.date, lang)} • {formatTime(selectedRecord.timestamp)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-90 flex items-center justify-center transition-all duration-150">
                                <X size={14} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">
                                {(() => {
                                    const w = WEATHER_ICON[selectedRecord.stress]
                                    if (!w) return null
                                    const Icon = (LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[w.icon]
                                    return Icon ? <Icon size={20} className={w.color} /> : null
                                })()}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${(selectedRecord.stress / 10) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{selectedRecord.stress}/10</span>
                        </div>

                        {selectedRecord.topic && (
                            <div className="mb-4">
                                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
                                    {selectedRecord.topic}
                                </span>
                            </div>
                        )}

                        {isReady(selectedRecord, nowTime) ? (
                            selectedRecord.journal ? (
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 font-bold mb-2 tracking-widest">JOURNAL</p>
                                    <p className="text-sm text-gray-600 leading-relaxed italic">"{selectedRecord.journal}"</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-300 text-center py-4">
                                    {isTH ? 'ไม่มีบันทึกเพิ่มเติม' : 'No journal entry'}
                                </p>
                            )
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-4 text-center">
                                <Lock size={20} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 font-medium">
                                    {isTH ? 'แคปซูลยังล็อกอยู่' : 'Capsule is still locked'}
                                </p>
                                <p className="text-xs text-gray-300 mt-1">
                                    {isTH ? 'เปิดได้อีก' : 'Opens in'}{' '}
                                    {getRemainingTime(selectedRecord.timestamp + LOCK_DURATION, nowTime, isTH)}
                                </p>
                            </div>
                        )}
                    </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}