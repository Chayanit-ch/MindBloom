import * as LucideIcons from 'lucide-react'
import { Heart, Zap, ChevronRight, Shirt, CheckCircle2, Star, Flame, PenLine, Package, AlertTriangle } from 'lucide-react'
import type { BuddyState, PageName, DailyRecord } from '../types'
import { useState } from 'react'
import Topbar from '../components/Topbar'

interface BuddyPageProps {
    buddy: BuddyState
    onNavigate: (page: PageName) => void
    onBeginQuest: (questId: string) => void
    onUpdateBuddy: (buddy: BuddyState) => void
    records: DailyRecord[]
    lang: 'th' | 'en'
    onToggleLang: () => void
}

function DynIcon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
    const icons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>
    const Icon = icons[name]
    if (!Icon) return null
    return <Icon size={size} className={className} />
}

const ALL_ITEMS = [
    { name: 'Zen Fountain', emoji: '⛲' },
    { name: 'Sun Hat',      emoji: '👒' },
    { name: 'Toy Ball',     emoji: '🧶' },
    { name: 'Magic Wand',   emoji: '🪄' },
    { name: 'Golden Seed',  emoji: '🌟' },
    { name: 'Rainbow',      emoji: '🌈' },
]

const ALL_AVATARS = [
    { src: '/assets/buddy.lottie',  name: 'Buddy 1', cost: 0   },
    { src: '/assets/buddy2.lottie', name: 'Buddy 2', cost: 50  },
    { src: '/assets/buddy3.lottie', name: 'Buddy 3', cost: 100 },
    { src: '/assets/buddy4.lottie', name: 'Buddy 4', cost: 150 },
    { src: '/assets/buddy5.lottie', name: 'Buddy 5', cost: 200 },
    { src: '/assets/buddy6.lottie', name: 'Buddy 6', cost: 250 },
    { src: '/assets/buddy7.lottie', name: 'Buddy 7', cost: 300 },
    { src: '/assets/buddy8.lottie', name: 'Buddy 8', cost: 400 },
]

const BONUS_QUESTS = [
    { id: 'breathe',  icon: 'Wind',         iconColor: 'text-sky-400',    titleTH: 'หายใจลึกๆ 3 ครั้ง',         titleEN: 'Take 3 Deep Breaths',         descTH: 'หยุดสักครู่ หายใจเข้าลึกๆ ช้าๆ',      descEN: 'Pause and breathe in slowly',             pts: 10 },
    { id: 'water',    icon: 'Droplets',      iconColor: 'text-cyan-500',   titleTH: 'ดื่มน้ำ 1 แก้ว',             titleEN: 'Drink a Glass of Water',       descTH: 'ร่างกายต้องการน้ำครับ',                descEN: 'Your body needs hydration',               pts: 10 },
    { id: 'stretch',  icon: 'Dumbbell',      iconColor: 'text-green-500',  titleTH: 'ยืดเส้นยืดสาย 5 นาที',      titleEN: 'Stretch for 5 Minutes',        descTH: 'ลุกขึ้นยืดขยับร่างกายสักครู่',         descEN: 'Get up and move your body',               pts: 10 },
    { id: 'write',    icon: 'PenLine',       iconColor: 'text-amber-500',  titleTH: 'เขียนสิ่งดีๆ 1 อย่าง',      titleEN: 'Write 1 Good Thing',           descTH: 'สิ่งดีที่เกิดขึ้นวันนี้คืออะไร',       descEN: 'What good happened today?',               pts: 10 },
    { id: 'message',  icon: 'Heart',         iconColor: 'text-pink-500',   titleTH: 'ส่งข้อความหาคนที่รัก',       titleEN: 'Message Someone You Love',     descTH: 'ทักทายคนที่คุณห่วงใยสักคน',           descEN: 'Greet someone you care about',            pts: 10 },
    { id: 'sunlight', icon: 'Sun',           iconColor: 'text-yellow-500', titleTH: 'รับแสงแดด 5 นาที',           titleEN: 'Get 5 Min of Sunlight',        descTH: 'ออกไปรับแสงแดดสักครู่',               descEN: 'Step outside for some sunshine',          pts: 10 },
    { id: 'noscreen', icon: 'MonitorOff',    iconColor: 'text-gray-500',   titleTH: 'พักจากหน้าจอ 10 นาที',       titleEN: '10 Min Screen Break',          descTH: 'วางโทรศัพท์ พักสายตา',                descEN: 'Put your phone down, rest your eyes',     pts: 10 },
]

const EMOTION_BUBBLE: Record<string, { bg: string; icon: string; iconColor: string; th: string; en: string }> = {
    Happy:   { bg: 'bg-yellow-50', icon: 'Sparkles',  iconColor: 'text-yellow-500', th: 'วันนี้รู้สึกดีมากเลย! ✨',             en: "Feeling great today! ✨"              },
    Calm:    { bg: 'bg-blue-50',   icon: 'Leaf',      iconColor: 'text-green-500',  th: 'ใจเย็นๆ ทุกอย่างจะผ่านไปได้',         en: "Stay calm, everything will pass"      },
    Anxious: { bg: 'bg-purple-50', icon: 'Wind',      iconColor: 'text-purple-400', th: 'หายใจลึกๆ นะ เดี๋ยวดีขึ้นเอง',        en: "Breathe deep, you'll feel better"    },
    Sad:     { bg: 'bg-indigo-50', icon: 'CloudRain', iconColor: 'text-indigo-400', th: 'ไม่เป็นไรนะ วันพรุ่งนี้ดีกว่าเสมอ',   en: "It's okay, tomorrow is a new day"   },
    Angry:   { bg: 'bg-red-50',    icon: 'Flame',     iconColor: 'text-red-400',    th: 'พักสักครู่ก่อนนะ',                    en: "Take a moment to breathe"            },
    Tired:   { bg: 'bg-gray-50',   icon: 'Moon',      iconColor: 'text-gray-400',   th: 'พักผ่อนให้เพียงพอด้วยนะ',             en: "Make sure to get enough rest"        },
}

function AvatarPreview({ src, size = 70 }: { src: string; size?: number }) {
    const cleanSrc = src.startsWith('/') ? src : `/${src}`
    const fullSrc = `https://mindbloom-4edd3.web.app${cleanSrc}`
    return (
        // @ts-expect-error dotlottie web component
        <dotlottie-wc
            src={fullSrc}
            autoplay
            loop
            style={{ width: size, height: size, display: 'block', margin: '0 auto' }}
        />
    )
}

function getLocalDateStr(date: Date = new Date()): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export default function BuddyPage({ buddy, onNavigate, onBeginQuest, onUpdateBuddy, records, lang, onToggleLang }: BuddyPageProps) {
    const [showItemPicker, setShowItemPicker] = useState(false)
    const [showAvatarPicker, setShowAvatarPicker] = useState(false)
    const [activeQuest, setActiveQuest] = useState<typeof BONUS_QUESTS[0] | null>(null)

    const isTH = lang === 'th'

    const sortedRecords = [...(records ?? [])].sort((a, b) => b.timestamp - a.timestamp)
    const latestEmotion = sortedRecords.length > 0 ? sortedRecords[0].emotion : 'Happy'
    const config = EMOTION_BUBBLE[latestEmotion] ?? EMOTION_BUBBLE['Happy']

    const today = getLocalDateStr()
    const checkedInToday = records.some(r => r.date === today)

    const dayIndex = new Date().getDate()
    const todayBonusQuests = [
        BONUS_QUESTS[dayIndex % BONUS_QUESTS.length],
        BONUS_QUESTS[(dayIndex + 1) % BONUS_QUESTS.length],
    ]

    const ownedItems = ALL_ITEMS.filter(i => (buddy.ownedItems ?? []).includes(i.name))
    const equippedItems = ALL_ITEMS.filter(i => (buddy.equippedItems ?? []).includes(i.name))
    const ownedAvatars = ALL_AVATARS.filter(a => (buddy.ownedAvatars ?? ['/assets/buddy.json']).includes(a.src))
    const shopAvatars = ALL_AVATARS.filter(a => !(buddy.ownedAvatars ?? ['/assets/buddy.json']).includes(a.src))

    const completedQuests = buddy.completedQuestDate === today ? (buddy.completedQuestIds ?? []) : []

    function toggleEquip(itemName: string) {
        const equipped = (buddy.equippedItems ?? []).includes(itemName)
        onUpdateBuddy({
            ...buddy,
            equippedItems: equipped
                ? (buddy.equippedItems ?? []).filter(i => i !== itemName)
                : [...(buddy.equippedItems ?? []), itemName],
        })
    }

    function switchAvatar(src: string) {
        onUpdateBuddy({ ...buddy, avatarSrc: src })
        setShowAvatarPicker(false)
    }

    function buyAvatar(avatar: typeof ALL_AVATARS[0]) {
        if (buddy.points < avatar.cost) return
        onUpdateBuddy({
            ...buddy,
            points: buddy.points - avatar.cost,
            ownedAvatars: [...(buddy.ownedAvatars ?? []), avatar.src],
            avatarSrc: avatar.src,
        })
        setShowAvatarPicker(false)
    }

    function completeQuest(questId: string, pts: number) {
        if (completedQuests.includes(questId)) return
        if (!checkedInToday) return
        const newCompleted = [...completedQuests, questId]
        onBeginQuest(questId)
        onUpdateBuddy({
            ...buddy,
            points: buddy.points + pts,
            completedQuestDate: today,
            completedQuestIds: newCompleted,
        })
    }

    const questTitle = (q: typeof BONUS_QUESTS[0]) => isTH ? q.titleTH : q.titleEN
    const questDesc  = (q: typeof BONUS_QUESTS[0]) => isTH ? q.descTH  : q.descEN

    return (
        <div className="pt-4">
            <Topbar buddy={buddy} lang={lang} onToggleLang={onToggleLang} />

            {/* Buddy Card */}
            <div className={`${config.bg} rounded-2xl p-6 text-center mb-4 shadow-sm transition-all duration-500 relative overflow-hidden`}>
                <div className="mb-2 flex justify-center">
                    <DynIcon name={config.icon} size={26} className={`${config.iconColor} animate-bounce`} />
                </div>

                <div className="absolute top-4 right-4 flex flex-col items-center gap-1">
                    {equippedItems.slice(0, 3).map(item => (
                        <span key={item.name} className="text-xl">{item.emoji}</span>
                    ))}
                    <button
                        onClick={() => setShowItemPicker(true)}
                        className="w-7 h-7 bg-white/70 hover:bg-white active:scale-90 rounded-full flex items-center justify-center mt-1 shadow-sm transition-all duration-150"
                    >
                        <Shirt size={13} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex justify-center">
                    <AvatarPreview src={buddy.avatarSrc ?? '/assets/buddy.lottie'} size={180} />
                </div>

                <div className="bg-white/80 rounded-xl px-4 py-3 mt-2">
                    <p className="text-gray-500 text-sm italic">"{isTH ? config.th : config.en}"</p>
                </div>

                <button
                    onClick={() => setShowAvatarPicker(true)}
                    className="mt-3 flex items-center gap-1 mx-auto bg-white/60 hover:bg-white/90 active:scale-95 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
                >
                    {isTH ? 'เปลี่ยนตัวละคร' : 'Change Avatar'} <ChevronRight size={12} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-1 mb-2">
                        <Heart size={12} className="text-red-400" />
                        <span className="text-xs font-bold text-gray-400 tracking-wide">{isTH ? 'ความสุข' : 'HAPPINESS'}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${buddy.happiness}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">{buddy.happiness}%</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                            <Zap size={12} className="text-purple-400" />
                            <span className="text-xs font-bold text-gray-400 tracking-wide">{isTH ? 'การเติบโต' : 'GROWTH'}</span>
                        </div>
                        <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">LVL {buddy.level}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${buddy.growth}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">{buddy.growth}/100</p>
                </div>

                <div className="bg-[#ede8f5] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                    <p className="text-xs text-purple-400 font-bold tracking-wide mb-2">{isTH ? 'ยอดแต้ม' : 'BALANCE'}</p>
                    <div className="flex items-center gap-1.5">
                        <Star size={16} className="text-yellow-500 fill-yellow-400" />
                        <span className="font-bold text-gray-700 text-lg">{buddy.points}</span>
                        <span className="text-xs text-gray-400 mt-0.5">pts</span>
                    </div>
                </div>

                <div className="bg-[#e8f0e8] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                    <p className="text-xs text-green-600 font-bold tracking-wide mb-2">{isTH ? 'ต่อเนื่อง' : 'STREAK'}</p>
                    <div className="flex items-center gap-1.5">
                        <Flame size={16} className="text-orange-500" />
                        <span className="font-bold text-gray-700 text-lg">{buddy.streak}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{isTH ? 'วัน' : 'days'}</span>
                    </div>
                </div>
            </div>

            {/* Daily Quests */}
            <div className="bg-[#2d5a27] rounded-2xl p-5 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="bg-white/20 text-white text-xs font-bold tracking-widest px-3 py-1 rounded-full">{isTH ? 'เควสประจำวัน' : 'DAILY QUEST'}</span>
                    <span className="text-white/50 text-xs">
                        {(checkedInToday ? 1 : 0) + completedQuests.length}/3 {isTH ? 'เสร็จแล้ว' : 'done'}
                    </span>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => !checkedInToday && onNavigate('checkin')}
                        className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-150 active:scale-[0.98] ${checkedInToday ? 'bg-green-700/50' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${checkedInToday ? 'bg-green-400/30' : 'bg-white/20'}`}>
                            {checkedInToday
                                ? <CheckCircle2 size={18} className="text-green-300" />
                                : <PenLine size={18} className="text-white/70" />}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white text-sm font-bold">{isTH ? 'บันทึกอารมณ์ประจำวัน' : 'Log your daily mood'}</p>
                            <p className="text-white/50 text-xs">+20 pts</p>
                        </div>
                        {checkedInToday
                            ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                            : <ChevronRight size={16} className="text-white/40 shrink-0" />}
                    </button>

                    {todayBonusQuests.map(quest => {
                        const done = completedQuests.includes(quest.id)
                        return (
                            <button key={quest.id} onClick={() => !done && setActiveQuest(quest)}
                                className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-150 active:scale-[0.98] ${done ? 'bg-green-700/50' : 'bg-white/10 hover:bg-white/20'}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-400/30' : 'bg-white/20'}`}>
                                    {done
                                        ? <CheckCircle2 size={18} className="text-green-300" />
                                        : <DynIcon name={quest.icon} size={18} className={quest.iconColor} />}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-white text-sm font-bold">{questTitle(quest)}</p>
                                    <p className="text-white/50 text-xs">{questDesc(quest)} • +{quest.pts} pts</p>
                                </div>
                                {done
                                    ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                                    : <ChevronRight size={16} className="text-white/40 shrink-0" />}
                            </button>
                        )
                    })}
                </div>

                <div className="flex gap-1.5 justify-center mt-4">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - (6 - i))
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const done = records.some(r => r.date === dateStr)
                        const isToday = i === 6
                        return (
                            <div key={i} className={`rounded-full transition-all duration-300 ${
                                done ? 'bg-green-400 w-2 h-2'
                                    : isToday ? 'bg-white/40 w-2 h-2 ring-1 ring-white/60'
                                        : 'bg-white/20 w-1.5 h-1.5'
                            }`} />
                        )
                    })}
                </div>
                <p className="text-white/30 text-[10px] text-center mt-1">{isTH ? '7 วันที่ผ่านมา' : 'Last 7 days'}</p>
            </div>

            {/* Item Picker Popup */}
            {showItemPicker && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 animate-overlay" onClick={() => setShowItemPicker(false)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col animate-sheet">
                        <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                            <h3 className="font-bold text-gray-800">{isTH ? 'ของตกแต่ง' : 'Accessories'}</h3>
                            <p className="text-xs text-gray-400 mt-1">{isTH ? 'กดเพื่อใส่หรือถอด' : 'Tap to equip or remove'}</p>
                        </div>
                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            {ownedItems.length > 0 ? (
                                <>
                                    <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ของที่มีแล้ว' : 'MY ITEMS'}</p>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {ownedItems.map(item => {
                                            const isEquipped = (buddy.equippedItems ?? []).includes(item.name)
                                            return (
                                                <button key={item.name} onClick={() => toggleEquip(item.name)}
                                                    className={`rounded-2xl p-3 text-center border transition-all duration-200 active:scale-95 ${isEquipped ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-transparent hover:border-green-200 hover:bg-white hover:shadow-sm'}`}>
                                                    <p className="text-3xl mb-1">{item.emoji}</p>
                                                    <p className="text-[10px] text-gray-600 font-medium">{item.name}</p>
                                                    <p className={`text-[10px] mt-0.5 font-bold ${isEquipped ? 'text-green-600' : 'text-gray-300'}`}>
                                                        {isEquipped ? (isTH ? '✓ ใส่อยู่' : '✓ On') : (isTH ? 'กดใส่' : 'Equip')}
                                                    </p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                        <Package size={24} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-400">{isTH ? 'ยังไม่มีของตกแต่งครับ' : 'No accessories yet'}</p>
                                    <p className="text-xs text-gray-300 mt-1">{isTH ? 'ซื้อได้ที่หน้า Rewards' : 'Buy from the Rewards page'}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ซื้อเพิ่ม' : 'BUY MORE'}</p>
                            <button onClick={() => { setShowItemPicker(false); onNavigate('rewards') }}
                                className="w-full bg-[#2d5a27] hover:bg-[#1e3d1a] active:scale-[0.98] text-white rounded-2xl py-3 text-sm font-bold transition-all duration-150">
                                {isTH ? 'ไปหน้า Rewards →' : 'Go to Rewards →'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Avatar Picker Popup */}
            {showAvatarPicker && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 animate-overlay" onClick={() => setShowAvatarPicker(false)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col animate-sheet">
                        <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                            <h3 className="font-bold text-gray-800">{isTH ? 'เปลี่ยนตัวละคร' : 'Change Avatar'}</h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <Star size={11} className="text-yellow-500 fill-yellow-400" />
                                <span>{buddy.points} pts {isTH ? 'คงเหลือ' : 'available'}</span>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            {ownedAvatars.length > 0 && (
                                <>
                                    <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ตัวละครที่มีแล้ว' : 'MY AVATARS'}</p>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {ownedAvatars.map(avatar => {
                                            const isActive = buddy.avatarSrc === avatar.src
                                            return (
                                                <button key={avatar.src} onClick={() => switchAvatar(avatar.src)}
                                                    className={`bg-white rounded-2xl p-3 border text-center transition-all duration-200 active:scale-[0.97] ${isActive ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-green-200 hover:shadow-sm'}`}>
                                                    <div className="h-20 flex items-center justify-center">
                                                        <AvatarPreview src={avatar.src} size={70} />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-700 mt-1">{avatar.name}</p>
                                                    <p className="text-[11px] mt-0.5">
                                                        {isActive
                                                            ? <span className="text-green-600 font-medium">✓ {isTH ? 'ใช้อยู่' : 'Active'}</span>
                                                            : <span className="text-gray-400">{isTH ? 'กดเปลี่ยน' : 'Select'}</span>}
                                                    </p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                            {shopAvatars.length > 0 && (
                                <>
                                    <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ซื้อเพิ่ม' : 'BUY MORE'}</p>
                                    <div className="grid grid-cols-2 gap-3 pb-4">
                                        {shopAvatars.map(avatar => {
                                            const canAfford = buddy.points >= avatar.cost
                                            return (
                                                <button key={avatar.src} onClick={() => canAfford && buyAvatar(avatar)}
                                                    className={`bg-white rounded-2xl p-3 border text-center transition-all duration-200 active:scale-[0.97] ${canAfford ? 'border-gray-100 hover:border-purple-200 hover:shadow-sm' : 'border-gray-100 opacity-50'}`}>
                                                    <div className="h-20 flex items-center justify-center">
                                                        <AvatarPreview src={avatar.src} size={70} />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-700 mt-1">{avatar.name}</p>
                                                    <div className={`flex items-center justify-center gap-1 mt-0.5 ${canAfford ? 'text-purple-600' : 'text-red-400'}`}>
                                                        <Star size={10} className={canAfford ? 'fill-yellow-400 text-yellow-400' : 'text-current'} />
                                                        <span className="text-[11px] font-medium">{avatar.cost} pts</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Quest Detail Popup */}
            {activeQuest && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 animate-overlay" onClick={() => setActiveQuest(null)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 p-5 pb-10 animate-sheet">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <DynIcon name={activeQuest.icon} size={36} className={activeQuest.iconColor} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-xl">{questTitle(activeQuest)}</h3>
                            <p className="text-gray-400 text-sm mt-2">{questDesc(activeQuest)}</p>
                            <p className="text-purple-600 font-bold text-sm mt-2">
                                +{activeQuest.pts} pts {isTH ? 'เมื่อทำเสร็จ' : 'when done'}
                            </p>
                        </div>
                        {!checkedInToday && (
                            <div className="bg-yellow-50 rounded-2xl p-3 mb-4 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
                                <p className="text-xs text-yellow-600">
                                    {isTH
                                        ? 'ต้องบันทึกอารมณ์วันนี้ก่อนถึงจะได้รับแต้มครับ'
                                        : 'Log your mood first to earn points'}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => { completeQuest(activeQuest.id, activeQuest.pts); setActiveQuest(null) }}
                            disabled={!checkedInToday || completedQuests.includes(activeQuest.id)}
                            className="w-full bg-[#2d5a27] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-bold mb-3 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            {isTH ? `ทำเสร็จแล้ว — รับ ${activeQuest.pts} pts` : `Done! — Claim ${activeQuest.pts} pts`}
                        </button>
                        <button onClick={() => setActiveQuest(null)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
                            {isTH ? 'ยังไม่ได้ทำ' : 'Not yet'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}