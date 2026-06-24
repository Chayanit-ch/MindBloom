import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { useLocalStorage } from './hooks/useLocalStorage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import BuddyPage from './pages/BuddyPage'
import CheckInPage from './pages/CheckInPage'
import HistoryPage from './pages/HistoryPage'
import RewardsPage from './pages/RewardsPage'
import InsightsPage from './pages/InsightsPage'
import type { PageName, DailyRecord, BuddyState } from './types'

const defaultBuddy: BuddyState = {
    happiness: 0,
    growth: 0,
    level: 1,
    points: 0,
    streak: 0,
    lastCheckIn: '',
    avatarSrc: '/assets/buddy.lottie',
    equippedItems: [],
    ownedItems: [],
    ownedAvatars: ['/assets/buddy.lottie'],
    completedQuestDate: '',
    completedQuestIds: [],
}

function getLocalDateStr(date: Date = new Date()): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function calculateStreak(records: DailyRecord[]): number {
    if (records.length === 0) return 0
    const dates = records.map(r => r.date).sort().reverse()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const today = getLocalDateStr()
    const yesterdayStr = getLocalDateStr(yesterday)
    if (dates[0] !== today && dates[0] !== yesterdayStr) return 0
    let streak = 0
    const checkDate = new Date(dates[0])
    for (const date of dates) {
        const checkStr = getLocalDateStr(checkDate)
        if (date === checkStr) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
        } else {
            break
        }
    }
    return streak
}


export default function App() {
    const [user, setUser] = useState<User | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [page, setPage] = useState<PageName>('buddy')
    const [records, setRecords] = useState<DailyRecord[]>([])
    const [buddy, setBuddy] = useState<BuddyState>(defaultBuddy)
    const [dataLoaded, setDataLoaded] = useState(false)
    const firestoreLoadedRef = useRef(false)
    const [lang, setLang] = useLocalStorage<'th' | 'en'>('mindbloom_lang', 'th')

    const toggleLang = () => setLang(l => l === 'th' ? 'en' : 'th')

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u)
            firestoreLoadedRef.current = false
            if (u) {
                const snap = await getDoc(doc(db, 'users', u.uid))
                if (snap.exists()) {
                    const data = snap.data()
                    const loadedRecords = data.records ?? []
                    setRecords(loadedRecords)
                    const calculatedStreak = calculateStreak(loadedRecords)
                    const rawAvatarSrc = (data.buddy?.avatarSrc ?? '/assets/buddy.lottie') as string
                    const fixedAvatarSrc = rawAvatarSrc
                        .replace('src/assets/', '/assets/')
                        .replace('.json', '.lottie')
                    const rawOwnedAvatars: string[] = data.buddy?.ownedAvatars ?? ['/assets/buddy.lottie']
                    const fixedOwnedAvatars = rawOwnedAvatars.map((s: string) =>
                        s.replace('src/assets/', '/assets/').replace('.json', '.lottie')
                    )
                    setBuddy({
                        ...defaultBuddy,
                        ...(data.buddy ?? {}),
                        equippedItems: data.buddy?.equippedItems ?? [],
                        ownedItems: data.buddy?.ownedItems ?? [],
                        ownedAvatars: fixedOwnedAvatars,
                        avatarSrc: fixedAvatarSrc,
                        completedQuestDate: data.buddy?.completedQuestDate ?? '',
                        completedQuestIds: data.buddy?.completedQuestIds ?? [],
                        streak: calculatedStreak,
                    })
                }
            }
            firestoreLoadedRef.current = true
            setDataLoaded(true)
            setAuthLoading(false)
        })
        return unsub
    }, [])

    useEffect(() => {
        if (!user) return
        if (!dataLoaded) return
        if (!firestoreLoadedRef.current) return
        setDoc(doc(db, 'users', user.uid), { records, buddy }, { merge: true })
    }, [records, buddy, user, dataLoaded])

    function handleCheckIn(record: DailyRecord) {
        const alreadyCheckedIn = records.some(r => r.date === record.date)

        setRecords(prev => {
            const filtered = prev.filter(r => r.date !== record.date)
            return [...filtered, record]
        })

        if (!alreadyCheckedIn) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = getLocalDateStr(yesterday)
            const hadYesterday = records.some(r => r.date === yesterdayStr)

            setBuddy(prev => {
                const newGrowth = prev.growth + 5
                const levelUp = newGrowth >= 100
                return {
                    ...prev,
                    happiness: Math.min(100, prev.happiness + 10),
                    growth: levelUp ? newGrowth - 100 : newGrowth,
                    level: levelUp ? prev.level + 1 : prev.level,
                    points: prev.points + 20,
                    streak: hadYesterday || prev.streak === 0 ? prev.streak + 1 : 1,
                    lastCheckIn: record.date,
                }
            })
        }

        setPage('buddy')
    }


    function handleBeginQuest(_questId: string) {
        const today = getLocalDateStr()
        const checkedInToday = records.some(r => r.date === today)
        if (!checkedInToday) return
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
                <div className="text-4xl animate-pulse">🌱</div>
            </div>
        )
    }

    if (!user) return <LoginPage />

    return (
        <div className="min-h-screen bg-[#f5f0eb]">
            <div key={page} className="animate-page max-w-sm mx-auto px-4 pb-24">
                {page === 'buddy' && (
                    <BuddyPage
                        buddy={buddy}
                        onNavigate={setPage}
                        onBeginQuest={handleBeginQuest}
                        onUpdateBuddy={setBuddy}
                        records={records}
                        lang={lang}
                        onToggleLang={toggleLang}
                    />
                )}
                {page === 'checkin' && (
                    <CheckInPage
                        onSave={handleCheckIn}
                        buddy={buddy}
                        lang={lang}
                        onToggleLang={toggleLang}
                        todayRecord={records.find(r => r.date === getLocalDateStr())}
                    />
                )}
                {page === 'history' && (
                    <HistoryPage
                        records={records}
                        buddy={buddy}
                        lang={lang}
                        onToggleLang={toggleLang}
                    />
                )}
                {page === 'rewards' && (
                    <RewardsPage
                        buddy={buddy}
                        records={records}
                        onUpdateBuddy={setBuddy}
                        lang={lang}
                        onToggleLang={toggleLang}
                    />
                )}
                {page === 'insights' && (
                    <InsightsPage
                        records={records}
                        buddy={buddy}
                        lang={lang}
                        onToggleLang={toggleLang}
                    />
                )}
            </div>
            <Navbar currentPage={page} onNavigate={setPage} onSignOut={() => signOut(auth)} />
        </div>
    )
}