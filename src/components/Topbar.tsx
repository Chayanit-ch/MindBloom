import { useState } from 'react'
import { User, LogOut, Sprout, Star, Flame, BarChart2 } from 'lucide-react'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import type { BuddyState } from '../types'

interface TopbarProps {
  buddy?: BuddyState
  lang?: 'th' | 'en'
  onToggleLang?: () => void
}

export default function Topbar({ buddy, lang = 'th', onToggleLang }: TopbarProps) {
  const [showProfile, setShowProfile] = useState(false)
  const user = auth.currentUser

  return (
    <div className="flex justify-between items-center mb-6 relative">

      {/* Profile Button */}
      <button
        onClick={() => setShowProfile(!showProfile)}
        className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 active:scale-90 transition-all duration-150"
      >
        <User size={18} />
      </button>

      <h2 className="font-bold text-green-800 text-base tracking-wide">MindBloom</h2>

      {/* Language Toggle */}
      <button
        onClick={onToggleLang}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-200 active:scale-90 transition-all duration-150"
        title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      >
        {lang === 'th' ? '🇹🇭' : '🇺🇸'}
      </button>

      {/* Dropdown */}
      {showProfile && (
        <>
          <div className="fixed inset-0 z-40 animate-overlay" onClick={() => setShowProfile(false)} />
          <div className="absolute top-12 left-0 z-50 bg-white rounded-2xl shadow-xl p-4 w-56 border border-gray-100 animate-scale-in">

            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Sprout size={20} className="text-green-600" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-700 text-sm truncate">
                  {user?.displayName ?? 'MindBloom User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Star size={11} className="text-yellow-500 fill-yellow-400" />
                  <span>{lang === 'th' ? 'แต้ม' : 'Points'}</span>
                </div>
                <span className="font-bold text-gray-700">{buddy?.points ?? 0} pts</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Flame size={11} className="text-orange-500" />
                  <span>{lang === 'th' ? 'วันต่อเนื่อง' : 'Streak'}</span>
                </div>
                <span className="font-bold text-gray-700">{buddy?.streak ?? 0} {lang === 'th' ? 'วัน' : 'days'}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={11} className="text-blue-500" />
                  <span>{lang === 'th' ? 'ระดับ' : 'Level'}</span>
                </div>
                <span className="font-bold text-gray-700">{lang === 'th' ? `ระดับ ${buddy?.level ?? 1}` : `LVL ${buddy?.level ?? 1}`}</span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => signOut(auth)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 rounded-xl py-2.5 text-sm font-medium transition-all duration-150"
            >
              <LogOut size={15} />
              {lang === 'th' ? 'ออกจากระบบ' : 'Sign Out'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}