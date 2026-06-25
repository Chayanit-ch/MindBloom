import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TOPICS, getMoodLabel, getMoodLabelTH, ALL_EMOTIONS, getEmotionsByLevel, EMOTION_TH, TOPIC_TH, WEATHER_ICON } from '../types/emotions'
import type { DailyRecord, EmotionName } from '../types'
import Topbar from '../components/Topbar'
import type { BuddyState } from '../types'
import * as LucideIcons from 'lucide-react'
import { Check, X, ClipboardCheck } from 'lucide-react'

interface CheckInPageProps {
    onSave: (record: DailyRecord) => void
    buddy: BuddyState
    lang: 'th' | 'en'
    onToggleLang: () => void
    todayRecord?: DailyRecord
    isAdmin?: boolean
    onOpenAdmin?: () => void
}

export default function CheckInPage({ onSave, buddy, lang, onToggleLang, todayRecord, isAdmin, onOpenAdmin }: CheckInPageProps) {
    const isTH = lang === 'th'

    // Determine initial topic state — if saved topic isn't in the list, it was a custom "Other" entry
    const _savedTopic = todayRecord?.topic ?? ''
    const _isCustomTopic = !!_savedTopic && !TOPICS.includes(_savedTopic)

    const [stress, setStress] = useState(todayRecord?.stress ?? 5)
    const [emotion, setEmotion] = useState<EmotionName | null>(
        (todayRecord?.emotion as EmotionName) ?? null
    )
    const [topic, setTopic] = useState<string | null>(
        _savedTopic ? (_isCustomTopic ? 'Other' : _savedTopic) : null
    )
    const [customTopic, setCustomTopic] = useState(_isCustomTopic ? _savedTopic : '')
    const [journal, setJournal] = useState(todayRecord?.journal ?? '')
    const [showPopup, setShowPopup] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [search, setSearch] = useState('')

    const moodLabel = isTH ? getMoodLabelTH(stress) : getMoodLabel(stress)
    const suggestedEmotions = getEmotionsByLevel(stress)
    const filteredAll = ALL_EMOTIONS.filter(e =>
        isTH
            ? (EMOTION_TH[e] ?? e).toLowerCase().includes(search.toLowerCase())
            : e.toLowerCase().includes(search.toLowerCase())
    )

    function handleSeal() {
        if (!emotion) {
            alert(isTH ? 'กรุณาเลือกอารมณ์ก่อนนะ' : 'Please select an emotion first.')
            return
        }
        const n = new Date()
        const record: DailyRecord = {
            date: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`,
            stress,
            emotion,
            topic: (topic === 'Other' && customTopic.trim()) ? customTopic.trim() : (topic ?? ''),
            journal,
            timestamp: Date.now(),
        }
        setShowSuccess(true)
        setTimeout(() => { setShowSuccess(false); onSave(record) }, 2000)
    }

    function displayEmotion(name: string) {
        return isTH ? (EMOTION_TH[name] ?? name) : name
    }

    function displayTopic(t: string) {
        return isTH ? (TOPIC_TH[t] ?? t) : t
    }

    const stepLabel = (n: string) => isTH ? `ขั้นที่ ${n}` : `STEP ${n}`

    return (
        <div className="pt-4">
            <Topbar buddy={buddy} lang={lang} onToggleLang={onToggleLang} isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} />

            {/* Success Popup */}
            {showSuccess && createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center px-6" onClick={() => setShowSuccess(false)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative bg-white rounded-3xl p-8 w-full max-w-xs text-center shadow-xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-600" />
                        </div>
                        <p className="font-bold text-gray-800 text-lg mb-1">บันทึกอารมณ์สำเร็จ</p>
                        <p className="text-sm text-gray-400">Bloom ได้รับพลังงานแล้ว วันนี้ทำได้ดีมากครับ</p>
                    </div>
                </div>,
                document.body
            )}

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 leading-snug">
                    {isTH
                        ? <>วันนี้ <span className="text-[#8b4513] italic font-serif">หัวใจ</span> รู้สึกยังไงบ้าง?</>
                        : <>How's your <span className="text-[#8b4513] italic font-serif">heart</span> feeling?</>
                    }
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    {isTH ? 'บันทึกอารมณ์และปิดผนึกแคปซูลวันนี้' : "Check in with your companion and seal today's capsule."}
                </p>
            </div>

            {/* Step 1: Mood Level */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-50 animate-step-1">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">{stepLabel('01')}</p>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-base">
                        {isTH ? 'วันนี้เป็นยังไงบ้าง?' : 'How was your day?'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">
                            {(() => {
                                const w = WEATHER_ICON[stress]
                                if (!w) return null
                                const Icon = (LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[w.icon]
                                return Icon ? <Icon size={24} className={w.color} /> : null
                            })()}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">{moodLabel}</span>
                    </div>
                </div>
                <input
                    type="range" min={1} max={10} value={stress}
                    onChange={(e) => {
                        setStress(Number(e.target.value))
                        setEmotion(null)
                    }}
                    className="w-full accent-green-600 h-2 cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-300">{isTH ? 'แย่มาก' : 'Terrible'}</span>
                    <span className="text-xs text-gray-300">{isTH ? 'ดีมาก' : 'Amazing'}</span>
                </div>
            </div>

            {/* Step 2: Emotion */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-50 animate-step-2">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">{stepLabel('02')}</p>
                <h3 className="font-bold text-gray-800 text-base mb-1">
                    {isTH ? 'อารมณ์ที่รู้สึกตอนนี้' : 'Current Emotion'}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    {isTH ? 'เลือกคำที่ตรงกับความรู้สึกของคุณ' : 'Select the word that matches your feeling'}
                </p>

                <div className="flex flex-wrap gap-2">
                    {suggestedEmotions.map((name) => (
                        <button
                            key={name}
                            onClick={() => setEmotion(name as EmotionName)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.97] ${emotion === name
                                ? 'bg-[#2d5a27] border-[#2d5a27] text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50'
                            }`}
                        >
                            {displayEmotion(name)}
                        </button>
                    ))}

                    <button
                        onClick={() => setShowPopup(true)}
                        className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-600 active:scale-[0.97] transition-all duration-150"
                    >
                        + {isTH ? 'ดูเพิ่มเติม' : 'See more'}
                    </button>
                </div>

                {emotion && !suggestedEmotions.includes(emotion) && (
                    <div className="flex items-center gap-2 mt-3 bg-green-50 rounded-xl px-3 py-2 w-fit animate-scale-in">
                        <Check size={13} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">{displayEmotion(emotion)}</span>
                        <button onClick={() => setEmotion(null)} className="hover:text-red-400 transition-colors">
                            <X size={13} className="text-gray-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* Step 3: Topic */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-50 animate-step-3">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">{stepLabel('03')}</p>
                <h3 className="font-bold text-gray-800 text-base mb-4">
                    {isTH ? 'กำลังคิดเรื่องอะไรอยู่?' : "What's on your mind?"}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                setTopic(topic === t ? null : t)
                                if (t !== 'Other') setCustomTopic('')
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.97] ${topic === t
                                ? 'bg-[#2d5a27] border-[#2d5a27] text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50'
                            }`}
                        >
                            {displayTopic(t)}
                        </button>
                    ))}
                </div>

                {topic === 'Other' && (
                    <div className="mt-3 animate-step-1">
                        <input
                            type="text"
                            placeholder={isTH ? 'ระบุเหตุผล...' : 'Describe your reason...'}
                            value={customTopic}
                            onChange={e => setCustomTopic(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none border border-green-200 focus:border-green-400 focus:bg-white transition-all duration-200 placeholder:text-gray-300"
                        />
                    </div>
                )}
            </div>

            {/* Step 4: Journal */}
            <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm border border-gray-50 animate-step-4">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest">{stepLabel('04')}</p>
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full font-medium">
                        {isTH ? 'ไม่บังคับ' : 'Optional'}
                    </span>
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-3">
                    {isTH ? 'บันทึกสั้นๆ' : 'Quick Journal'}
                </h3>
                <textarea
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder={isTH ? 'เขียนอะไรสักอย่างให้ตัวเองในอนาคต...' : 'Write a short note to your future self...'}
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-600 resize-none outline-none h-24 placeholder:text-gray-300 border border-gray-100 focus:border-green-200 focus:bg-white transition-all duration-200"
                />
            </div>

            {/* Seal Button */}
            <button
                onClick={handleSeal}
                disabled={showSuccess}
                className="w-full bg-[#2d5a27] hover:bg-[#1e3d1a] active:scale-[0.98] text-white rounded-2xl py-4 font-semibold text-base transition-all duration-150 mb-2 shadow-sm flex items-center justify-center gap-2 animate-step-5 disabled:opacity-60"
            >
                <ClipboardCheck size={20} />
                {isTH ? 'บันทึกวันนี้' : 'Seal the Capsule'}
            </button>
            <p className="text-center text-[10px] text-gray-300 mb-8 tracking-widest font-medium">
                {isTH ? 'ข้อมูลของคุณปลอดภัยและเป็นส่วนตัว' : 'SAFE & PRIVATE • ENCRYPTION ACTIVE'}
            </p>

            {/* Popup — All Emotions */}
            {showPopup && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-9998"
                        onClick={() => { setShowPopup(false); setSearch('') }}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-9999 max-w-sm mx-auto bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '80vh' }}>
                        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    {isTH ? 'อารมณ์ทั้งหมด' : 'All Emotions'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">{ALL_EMOTIONS.length} {isTH ? 'คำ' : 'words'}</p>
                            </div>
                            <button
                                onClick={() => { setShowPopup(false); setSearch('') }}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-90 flex items-center justify-center transition-all duration-150"
                            >
                                <X size={15} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="shrink-0 px-5 pb-3">
                            <input
                                type="text"
                                placeholder={isTH ? 'ค้นหา...' : 'Search...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none text-gray-600 placeholder:text-gray-300 border border-gray-100 focus:border-green-200 focus:bg-white transition-all duration-200"
                            />
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 pb-20">
                            <div className="flex flex-wrap gap-2 pt-1">
                                {filteredAll.map((name) => (
                                    <button
                                        key={name}
                                        onClick={() => {
                                            setEmotion(name as EmotionName)
                                            setShowPopup(false)
                                            setSearch('')
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.97] ${emotion === name
                                            ? 'bg-[#2d5a27] border-[#2d5a27] text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50'
                                        }`}
                                    >
                                        {displayEmotion(name)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}
