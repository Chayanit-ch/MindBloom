import { useState } from 'react'
import type { BuddyState, DailyRecord } from '../types'
import Topbar from '../components/Topbar'
import { Lock, Check, Star, Flame, Sparkles, Unlock, Clock } from 'lucide-react'

function AvatarPreview({ src, size = 70 }: { src: string; size?: number }) {
    const cleanSrc = src.startsWith('/') ? src : `/${src}`
    const fullSrc = `https://mindbloom-4edd3.web.app${cleanSrc}`
    return (
        // @ts-expect-error dotlottie web component
        <dotlottie-wc
            src={fullSrc}
            autoplay
            loop
            style={{ width: size, height: size }}
        />
    )
}

interface RewardsPageProps {
    buddy: BuddyState
    records: DailyRecord[]
    onUpdateBuddy: (buddy: BuddyState) => void
    lang: 'th' | 'en'
    onToggleLang: () => void
}

const AVATARS = [
    { id: 1, src: '/assets/buddy.lottie', name: 'Buddy 1', cost: 0 },
    { id: 2, src: '/assets/buddy2.lottie', name: 'Buddy 2', cost: 50 },
    { id: 3, src: '/assets/buddy3.lottie', name: 'Buddy 3', cost: 100 },
    { id: 4, src: '/assets/buddy4.lottie', name: 'Buddy 4', cost: 150 },
    { id: 5, src: '/assets/buddy5.lottie', name: 'Buddy 5', cost: 200 },
    { id: 6, src: '/assets/buddy6.lottie', name: 'Buddy 6', cost: 250 },
    { id: 7, src: '/assets/buddy7.lottie', name: 'Buddy 7', cost: 300 },
    { id: 8, src: '/assets/buddy8.lottie', name: 'Buddy 8', cost: 400 },
]

const COLLECTION_ITEMS = [
    { id: 1, name: 'Zen Fountain', emoji: '⛲', unlockDay: 7, category: 'GARDEN', cost: 30 },
    { id: 2, name: 'Sun Hat', emoji: '👒', unlockDay: 14, category: 'ACCESSORY', cost: 50 },
    { id: 3, name: 'Toy Ball', emoji: '🧶', unlockDay: 21, category: 'TOY', cost: 80 },
    { id: 4, name: 'Magic Wand', emoji: '🪄', unlockDay: 30, category: 'SPECIAL', cost: 120 },
    { id: 5, name: 'Golden Seed', emoji: '🌟', unlockDay: 50, category: 'RARE', cost: 200 },
    { id: 6, name: 'Rainbow', emoji: '🌈', unlockDay: 100, category: 'LEGENDARY', cost: 400 },
]

const SPECIAL_REWARDS = [
    { id: 1, name: 'Secret Quest', nameEN: 'Secret Quest', icon: 'Unlock', desc: 'ปลดล็อก Quest พิเศษ', descEN: 'Unlock a special Quest', cost: 100 },
    { id: 2, name: 'Early Capsule', nameEN: 'Early Capsule', icon: 'Clock', desc: 'เปิด Capsule ก่อนครบ 7 วัน', descEN: 'Open a Capsule before 7 days', cost: 150 },
]

const DAY_NAMES_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
const DAY_NAMES_EN = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']
const NOW = new Date()

function PtsBadge({ cost, canAfford = true }: { cost: number; canAfford?: boolean }) {
    return (
        <div className={`flex items-center justify-center gap-1 ${canAfford ? 'text-purple-600' : 'text-red-400'}`}>
            <Star size={11} className={canAfford ? 'fill-yellow-400 text-yellow-400' : 'text-current'} />
            <span className="font-medium text-[11px]">{cost} pts</span>
        </div>
    )
}

export default function RewardsPage({ buddy, records, onUpdateBuddy, lang, onToggleLang }: RewardsPageProps) {
    const [confirmItem, setConfirmItem] = useState<typeof COLLECTION_ITEMS[0] | null>(null)
    const [confirmAvatar, setConfirmAvatar] = useState<typeof AVATARS[0] | null>(null)
    const [confirmSpecial, setConfirmSpecial] = useState<typeof SPECIAL_REWARDS[0] | null>(null)
    const [showAvatarPicker, setShowAvatarPicker] = useState(false)

    const isTH = lang === 'th'
    const DAY_NAMES = isTH ? DAY_NAMES_TH : DAY_NAMES_EN

    const year = NOW.getFullYear()
    const month = NOW.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = NOW.getDate()
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7

    const recordMap: Record<string, boolean> = {}
    records.forEach(r => { recordMap[r.date] = true })

    function getDateStr(day: number) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    const ownedItemNames = buddy.ownedItems ?? []
    const equippedItemNames = buddy.equippedItems ?? []
    const ownedAvatarSrcs = buddy.ownedAvatars ?? ['/assets/buddy.json']

    const myItems = COLLECTION_ITEMS.filter(i => ownedItemNames.includes(i.name))
    const shopItems = COLLECTION_ITEMS.filter(i => !ownedItemNames.includes(i.name) && buddy.streak >= i.unlockDay)
    const lockedItems = COLLECTION_ITEMS.filter(i => !ownedItemNames.includes(i.name) && buddy.streak < i.unlockDay)
    const ownedAvatars = AVATARS.filter(a => ownedAvatarSrcs.includes(a.src))
    const shopAvatars = AVATARS.filter(a => !ownedAvatarSrcs.includes(a.src))

    function toggleEquip(itemName: string) {
        const equipped = equippedItemNames.includes(itemName)
        onUpdateBuddy({ ...buddy, equippedItems: equipped ? equippedItemNames.filter(i => i !== itemName) : [...equippedItemNames, itemName] })
    }
    function buyItem(item: typeof COLLECTION_ITEMS[0]) {
        if (buddy.points < item.cost) return
        onUpdateBuddy({ ...buddy, points: buddy.points - item.cost, ownedItems: [...ownedItemNames, item.name], equippedItems: [...equippedItemNames, item.name] })
        setConfirmItem(null)
    }
    function switchAvatar(src: string) {
        onUpdateBuddy({ ...buddy, avatarSrc: src })
        setShowAvatarPicker(false)
    }
    function buyAvatar(avatar: typeof AVATARS[0]) {
        if (buddy.points < avatar.cost) return
        onUpdateBuddy({ ...buddy, points: buddy.points - avatar.cost, ownedAvatars: [...ownedAvatarSrcs, avatar.src], avatarSrc: avatar.src })
        setConfirmAvatar(null)
        setShowAvatarPicker(false)
    }
    function buySpecial(item: typeof SPECIAL_REWARDS[0]) {
        if (buddy.points < item.cost) return
        onUpdateBuddy({ ...buddy, points: buddy.points - item.cost })
        setConfirmSpecial(null)
    }

    const calendarLabel = NOW.toLocaleDateString(isTH ? 'th-TH' : 'en-GB', { month: 'long', year: 'numeric' })

    return (
        <div className="pt-4">
            <Topbar buddy={buddy} lang={lang} onToggleLang={onToggleLang} />

            <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">MOMENTUM</p>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Day <span className="text-green-700">{buddy.streak}</span> Streak
            </h1>
            <p className="text-gray-400 text-sm mb-5">
                {isTH ? 'บันทึกทุกวันเพื่อสะสม streak และแต้มครับ' : 'Record every day to build your streak and earn points.'}
            </p>

            {/* Calendar */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-50 animate-step-1">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-gray-700">{calendarLabel}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                        <Flame size={13} className="text-orange-500" />
                        <span>{buddy.streak} {isTH ? 'วันติดต่อกัน' : 'day streak'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300 pb-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const dateStr = getDateStr(day)
                        const checked = recordMap[dateStr]
                        const isPast = day < today
                        const isToday = day === today
                        return (
                            <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${checked ? 'bg-green-600 text-white' : isToday ? 'ring-2 ring-green-400 bg-white' : isPast ? 'bg-red-50' : 'bg-gray-50'
                                }`}>
                                <span className="text-[9px] font-bold leading-none">{checked ? '✓' : isPast ? '✗' : ''}</span>
                                <span className={`text-[9px] leading-none mt-0.5 ${checked ? 'text-white/80' : isToday ? 'text-green-600 font-bold' : isPast ? 'text-red-300' : 'text-gray-300'}`}>{day}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-600" /><span className="text-[10px] text-gray-400">{isTH ? 'บันทึกแล้ว' : 'Logged'}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-50 border border-red-100" /><span className="text-[10px] text-gray-400">{isTH ? 'ยังไม่ได้บันทึก' : 'Missed'}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" /><span className="text-[10px] text-gray-400">{isTH ? 'วันข้างหน้า' : 'Upcoming'}</span></div>
                </div>
            </div>

            {/* Points */}
            <div className="bg-[#ede8f5] rounded-2xl p-4 mb-5 flex items-center justify-between animate-step-2">
                <div>
                    <p className="text-xs text-purple-400 font-bold tracking-widest mb-1">BALANCE</p>
                    <div className="flex items-baseline gap-1.5">
                        <Star size={20} className="text-yellow-500 fill-yellow-400 mb-0.5" />
                        <span className="text-2xl font-bold text-gray-800">{buddy.points}</span>
                        <span className="text-base font-medium text-gray-500">pts</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Level</p>
                    <div className="bg-purple-100 text-purple-700 text-sm font-bold px-3 py-1 rounded-full">LVL {buddy.level}</div>
                </div>
            </div>

            {/* Avatar */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-gray-800">{isTH ? 'ตัวละคร' : 'Avatar'}</h2>
                <button onClick={() => setShowAvatarPicker(true)} className="text-xs text-green-700 font-bold hover:text-green-900 transition-colors active:scale-95">
                    {isTH ? 'เปลี่ยนตัวละคร →' : 'Change Avatar →'}
                </button>
            </div>
            <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 animate-step-3">
                <div className="w-20 h-20 shrink-0">
                    <AvatarPreview src={buddy.avatarSrc ?? '/assets/buddy.json'} size={80} />
                </div>
                <div>
                    <p className="font-bold text-gray-800">{AVATARS.find(a => a.src === buddy.avatarSrc)?.name ?? 'Buddy 1'}</p>
                    <p className="text-xs text-gray-400 mt-1">{isTH ? 'ตัวละครปัจจุบัน' : 'Current Avatar'}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {equippedItemNames.map(name => (
                            <span key={name} className="text-lg">{COLLECTION_ITEMS.find(c => c.name === name)?.emoji}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Collection */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-gray-800">My Collection</h2>
                <p className="text-xs text-gray-400">
                    {myItems.length}/{COLLECTION_ITEMS.length} {isTH ? 'ปลดล็อกแล้ว' : 'unlocked'}
                </p>
            </div>

            {myItems.length > 0 && (
                <>
                    <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ของที่มีแล้ว' : 'MY ITEMS'}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {myItems.map(item => {
                            const equipped = equippedItemNames.includes(item.name)
                            return (
                                <button key={item.id} onClick={() => toggleEquip(item.name)}
                                    className={`bg-white rounded-2xl p-4 shadow-sm border text-left transition-all duration-200 active:scale-[0.97] ${equipped ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-green-200 hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${equipped ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.category}</span>
                                        {equipped && <Check size={14} className="text-green-600" />}
                                    </div>
                                    <p className="text-4xl text-center my-3">{item.emoji}</p>
                                    <p className="text-sm font-bold text-gray-700 text-center">{item.name}</p>
                                    <p className="text-[11px] text-center mt-1 font-medium">
                                        {equipped
                                            ? <span className="text-green-600">{isTH ? '✓ กำลังใส่อยู่ • กดถอด' : '✓ Equipped • Tap to remove'}</span>
                                            : <span className="text-gray-400">{isTH ? 'กดเพื่อใส่' : 'Tap to equip'}</span>
                                        }
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {(shopItems.length > 0 || lockedItems.length > 0) && (
                <>
                    <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">{isTH ? 'ซื้อเพิ่ม' : 'BUY MORE'}</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {shopItems.map(item => (
                            <button key={item.id} onClick={() => setConfirmItem(item)}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md text-left transition-all duration-200 active:scale-[0.97]">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">{item.category}</span>
                                </div>
                                <p className="text-4xl text-center my-3">{item.emoji}</p>
                                <p className="text-sm font-bold text-gray-700 text-center">{item.name}</p>
                                <PtsBadge cost={item.cost} canAfford={buddy.points >= item.cost} />
                            </button>
                        ))}
                        {lockedItems.map(item => (
                            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 opacity-40">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-400">{item.category}</span>
                                    <Lock size={12} className="text-gray-300" />
                                </div>
                                <p className="text-4xl text-center my-3">{item.emoji}</p>
                                <p className="text-sm font-bold text-gray-700 text-center">{item.name}</p>
                                <div className="flex items-center justify-center gap-1 text-gray-300 mt-1">
                                    <Lock size={10} />
                                    <span className="text-[11px]">Day {item.unlockDay}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Special Rewards */}
            <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h2 className="text-base font-bold text-gray-800">Special Rewards</h2>
            </div>
            <div className="space-y-3 mb-6">
                {SPECIAL_REWARDS.map(item => {
                    const canAfford = buddy.points >= item.cost
                    const IconComp = item.icon === 'Unlock' ? Unlock : Clock
                    return (
                        <button key={item.id} onClick={() => setConfirmSpecial(item)}
                            className="w-full bg-[#2d5a27] rounded-2xl p-4 flex items-center gap-3 hover:bg-[#1e3d1a] active:scale-[0.98] transition-all duration-150">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <IconComp size={20} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-bold text-sm">{isTH ? item.name : item.nameEN}</p>
                                <p className="text-white/60 text-xs mt-0.5">{isTH ? item.desc : item.descEN}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${canAfford ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                                <Star size={11} className={canAfford ? 'fill-yellow-300 text-yellow-300' : 'text-current'} />
                                <span>{item.cost}</span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Confirm Item */}
            {confirmItem && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 animate-overlay" onClick={() => setConfirmItem(null)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 p-5 pb-10 animate-sheet">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                        <div className="text-center mb-5">
                            <p className="text-5xl mb-3">{confirmItem.emoji}</p>
                            <h3 className="font-bold text-gray-800 text-lg">{confirmItem.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {isTH ? 'ซื้อแล้วเป็นเจ้าของถาวร ใส่ถอดได้ฟรีครับ' : 'Yours forever — equip and remove anytime for free.'}
                            </p>
                            <PtsBadge cost={confirmItem.cost} />
                        </div>
                        {buddy.points < confirmItem.cost && (
                            <div className="bg-red-50 rounded-xl p-3 mb-4 text-center">
                                <p className="text-sm text-red-500">
                                    {isTH ? `แต้มไม่พอครับ (มี ${buddy.points} pts)` : `Not enough points (you have ${buddy.points} pts)`}
                                </p>
                            </div>
                        )}
                        <button onClick={() => buyItem(confirmItem)} disabled={buddy.points < confirmItem.cost}
                            className="w-full bg-[#2d5a27] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-bold mb-3 active:scale-[0.98] transition-all duration-150">
                            {isTH ? `ซื้อเลย — ${confirmItem.cost} pts` : `Buy — ${confirmItem.cost} pts`}
                        </button>
                        <button onClick={() => setConfirmItem(null)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
                            {isTH ? 'ยกเลิก' : 'Cancel'}
                        </button>
                    </div>
                </>
            )}

            {/* Confirm Special */}
            {confirmSpecial && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 animate-overlay" onClick={() => setConfirmSpecial(null)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 p-5 pb-10 animate-sheet">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                        <div className="text-center mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#2d5a27]/10 flex items-center justify-center mx-auto mb-3">
                                {confirmSpecial.icon === 'Unlock'
                                    ? <Unlock size={30} className="text-[#2d5a27]" />
                                    : <Clock size={30} className="text-[#2d5a27]" />}
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">{isTH ? confirmSpecial.name : confirmSpecial.nameEN}</h3>
                            <p className="text-sm text-gray-400 mt-1">{isTH ? confirmSpecial.desc : confirmSpecial.descEN}</p>
                            <PtsBadge cost={confirmSpecial.cost} />
                        </div>
                        {buddy.points < confirmSpecial.cost && (
                            <div className="bg-red-50 rounded-xl p-3 mb-4 text-center">
                                <p className="text-sm text-red-500">
                                    {isTH ? `แต้มไม่พอครับ (มี ${buddy.points} pts)` : `Not enough points (you have ${buddy.points} pts)`}
                                </p>
                            </div>
                        )}
                        <button onClick={() => buySpecial(confirmSpecial)} disabled={buddy.points < confirmSpecial.cost}
                            className="w-full bg-[#2d5a27] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-bold mb-3 active:scale-[0.98] transition-all duration-150">
                            {isTH ? `แลกเลย — ${confirmSpecial.cost} pts` : `Redeem — ${confirmSpecial.cost} pts`}
                        </button>
                        <button onClick={() => setConfirmSpecial(null)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
                            {isTH ? 'ยกเลิก' : 'Cancel'}
                        </button>
                    </div>
                </>
            )}

            {/* Avatar Picker */}
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
                                                <button key={avatar.src} onClick={() => canAfford && setConfirmAvatar(avatar)}
                                                    className={`bg-white rounded-2xl p-3 border text-center transition-all duration-200 active:scale-[0.97] ${canAfford ? 'border-gray-100 hover:border-purple-200 hover:shadow-sm' : 'border-gray-100 opacity-50'}`}>
                                                    <div className="h-20 flex items-center justify-center">
                                                        <AvatarPreview src={avatar.src} size={70} />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-700 mt-1">{avatar.name}</p>
                                                    <PtsBadge cost={avatar.cost} canAfford={canAfford} />
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

            {/* Confirm Avatar */}
            {confirmAvatar && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 animate-overlay" onClick={() => setConfirmAvatar(null)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-3xl z-50 p-5 pb-10 animate-sheet">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                        <div className="text-center mb-5">
                            <div className="h-24 flex items-center justify-center">
                                <AvatarPreview src={confirmAvatar.src} size={90} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg mt-2">{confirmAvatar.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {isTH ? 'ซื้อแล้วเป็นเจ้าของถาวรครับ' : 'Yours forever once purchased.'}
                            </p>
                            <PtsBadge cost={confirmAvatar.cost} />
                        </div>
                        <button onClick={() => buyAvatar(confirmAvatar)}
                            className="w-full bg-[#2d5a27] text-white rounded-2xl py-4 font-bold mb-3 active:scale-[0.98] transition-all duration-150">
                            {isTH ? `ซื้อเลย — ${confirmAvatar.cost} pts` : `Buy — ${confirmAvatar.cost} pts`}
                        </button>
                        <button onClick={() => setConfirmAvatar(null)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
                            {isTH ? 'ยกเลิก' : 'Cancel'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
