import { Home, PenLine, Calendar, Gift, BarChart2 } from 'lucide-react'
import type { PageName } from '../types'

interface NavbarProps {
    currentPage: PageName
    onNavigate: (page: PageName) => void
    onSignOut: () => void
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
    const items = [
        { page: 'buddy'    as PageName, icon: Home,      label: 'BUDDY'    },
        { page: 'checkin'  as PageName, icon: PenLine,   label: 'CHECK-IN' },
        { page: 'history'  as PageName, icon: Calendar,  label: 'HISTORY'  },
        { page: 'rewards'  as PageName, icon: Gift,      label: 'REWARDS'  },
        { page: 'insights' as PageName, icon: BarChart2, label: 'INSIGHTS' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 px-2 py-2 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            {items.map(({ page, icon: Icon, label }) => {
                const isActive = currentPage === page
                return (
                    <button
                        key={page}
                        onClick={() => onNavigate(page)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
                            isActive
                                ? 'bg-[#2d5a27] text-white shadow-sm scale-105'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                        <span className="text-[9px] font-bold tracking-wider">{label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
