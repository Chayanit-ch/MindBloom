import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, collectionGroup } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import type { DailyRecord, AssessmentRecord, EmotionName } from '../types'
import { EMOTION_TH, TOPIC_TH } from '../types/emotions'
import {
  Shield, Search, Download, Users, AlertTriangle,
  ArrowLeft, Activity, LogOut, RefreshCw, ChevronRight, ChevronLeft, X,
  ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical,
} from 'lucide-react'

interface UserData {
  uid: string
  email: string
  streak: number
  records: DailyRecord[]
  latestPHQ9: AssessmentRecord | null
  latestGAD7: AssessmentRecord | null
  latestPSS10: AssessmentRecord | null
  allAssessments: AssessmentRecord[]
  isHighRisk: boolean
  hasNegativeStreak: boolean
}

const NEGATIVE_EMOTIONS = new Set([
  'Sad', 'Anxious', 'Angry', 'Hopeless', 'Drained',
  'Overwhelmed', 'Scared', 'Worried', 'Stressed',
  'Frustrated', 'Lonely', 'Discouraged', 'Disappointed',
  'Ashamed', 'Guilty', 'Irritated', 'Jealous', 'Embarrassed',
])

function datStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcStreak(records: DailyRecord[]): number {
  if (!records.length) return 0
  const dates = [...new Set(records.map(r => r.date))].sort().reverse()
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  if (dates[0] !== datStr() && dates[0] !== datStr(yest)) return 0
  let n = 0
  const d = new Date(dates[0])
  for (const date of dates) {
    if (date === datStr(d)) { n++; d.setDate(d.getDate() - 1) } else break
  }
  return n
}

function hasNegStreak(records: DailyRecord[], min = 3): boolean {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  let streak = 0, prev: string | null = null
  for (const r of sorted) {
    if (NEGATIVE_EMOTIONS.has(r.emotion)) {
      if (prev) {
        const expected = new Date(prev); expected.setDate(expected.getDate() + 1)
        streak = datStr(expected) === r.date ? streak + 1 : 1
      } else streak = 1
      if (streak >= min) return true
      prev = r.date
    } else { streak = 0; prev = null }
  }
  return false
}

function scoreColor(type: 'PHQ9' | 'GAD7' | 'PSS10', score: number): string {
  if (type === 'PSS10') {
    if (score >= 27) return 'text-red-600 bg-red-50'
    if (score >= 14) return 'text-orange-500 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }
  if (score >= 10) return 'text-red-600 bg-red-50'
  if (score >= 5) return 'text-orange-500 bg-orange-50'
  return 'text-green-600 bg-green-50'
}

function buildCSV(users: UserData[]): void {
  const headers = [
    'อีเมล', 'ความต่อเนื่อง', 'จำนวนบันทึก',
    'วันที่บันทึกล่าสุด', 'อารมณ์ล่าสุด', 'บันทึกล่าสุด',
    'PHQ9 คะแนน', 'PHQ9 ระดับ',
    'GAD7 คะแนน', 'GAD7 ระดับ',
    'PSS10 คะแนน', 'PSS10 ระดับ',
    'เสี่ยงสูง (PHQ9≥10)', 'เฝ้าระวัง (อารมณ์ลบต่อเนื่อง)',
  ]
  const rows = users.map(u => {
    const last = u.records.length > 0
      ? [...u.records].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null
    return [
      u.email, u.streak, u.records.length,
      last?.date ?? '-',
      last ? (EMOTION_TH[last.emotion] ?? last.emotion) : '-',
      last?.journal?.replace(/[\n\r,]/g, ' ').slice(0, 100) ?? '-',
      u.latestPHQ9?.score ?? '-', u.latestPHQ9?.label ?? '-',
      u.latestGAD7?.score ?? '-', u.latestGAD7?.label ?? '-',
      u.latestPSS10?.score ?? '-', u.latestPSS10?.label ?? '-',
      u.isHighRisk ? 'ใช่' : 'ไม่',
      u.hasNegativeStreak ? 'ใช่' : 'ไม่',
    ]
  })
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `mindbloom-admin-${datStr()}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

function drawChart(canvas: HTMLCanvasElement, records: DailyRecord[]): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.offsetWidth * dpr
  canvas.height = canvas.offsetHeight * dpr
  ctx.scale(dpr, dpr)
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  const pad = { t: 16, r: 16, b: 26, l: 28 }
  const plotW = w - pad.l - pad.r
  const plotH = h - pad.t - pad.b
  const stepX = plotW / 29

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const ds = datStr(d)
    const rec = records.find(r => r.date === ds)
    return { dayNum: d.getDate(), stress: rec?.stress ?? 0, emotion: rec?.emotion ?? null, hasData: !!rec }
  })

  const pts = chartData
    .map((d, i) => d.hasData
      ? { x: pad.l + i * stepX, y: pad.t + plotH - (d.stress / 10) * plotH, emotion: d.emotion }
      : null)
    .filter((p): p is { x: number; y: number; emotion: EmotionName | null } => p !== null)

  ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * plotH
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
  }
  ctx.fillStyle = '#ccc'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
  ;[10, 7.5, 5, 2.5, 0].forEach((v, i) => {
    ctx.fillText(String(v), pad.l - 4, pad.t + (i / 4) * plotH + 3)
  })

  ctx.fillStyle = '#bbb'; ctx.textAlign = 'center'
  chartData.forEach((d, i) => {
    if (i % 5 !== 0) return
    ctx.fillText(String(d.dayNum), pad.l + i * stepX, h - 4)
  })

  if (pts.length < 2) {
    ctx.fillStyle = '#ccc'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('บันทึกอย่างน้อย 2 วันเพื่อดูกราฟ', w / 2, h / 2)
    return
  }

  const smooth = (p: { x: number; y: number }[], t = 0.35) => {
    ctx.moveTo(p[0].x, p[0].y)
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)]
      ctx.bezierCurveTo(
        p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t,
        p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t,
        p2.x, p2.y,
      )
    }
  }

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH)
  grad.addColorStop(0, 'rgba(45,90,39,0.22)')
  grad.addColorStop(0.55, 'rgba(45,90,39,0.08)')
  grad.addColorStop(1, 'rgba(45,90,39,0)')
  ctx.beginPath(); smooth(pts)
  ctx.lineTo(pts[pts.length - 1].x, pad.t + plotH)
  ctx.lineTo(pts[0].x, pad.t + plotH)
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

  ctx.beginPath(); ctx.strokeStyle = '#2d5a27'; ctx.lineWidth = 2
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; smooth(pts); ctx.stroke()

  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = p.emotion && NEGATIVE_EMOTIONS.has(p.emotion) ? '#ef4444' : '#2d5a27'
    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
  })
}

export default function AdminPage({ onClose }: { onClose?: () => void }) {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserData | null>(null)
  const [tab, setTab] = useState<'PHQ9' | 'GAD7' | 'PSS10'>('PHQ9')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'high' | 'warn' | 'ok'>('all')

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!selected) return
    let raf = 0
    raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (canvas && canvas.offsetWidth > 0) drawChart(canvas, selected.records)
    })
    return () => cancelAnimationFrame(raf)
  }, [selected])

  async function loadData() {
    setLoading(true); setError(null)
    try {
      const [usersSnap, assmtSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collectionGroup(db, 'assessments')),
      ])
      const byUid: Record<string, AssessmentRecord[]> = {}
      assmtSnap.docs.forEach(d => {
        const uid = d.ref.parent.parent?.id
        if (!uid) return
        ;(byUid[uid] ??= []).push({ id: d.id, ...d.data() } as AssessmentRecord)
      })
      setUsers(
        usersSnap.docs.map(d => {
          const data = d.data()
          const uid = d.id
          const records: DailyRecord[] = data.records ?? []
          const asmts = (byUid[uid] ?? []).sort((a, b) => b.timestamp - a.timestamp)
          const latestPHQ9 = asmts.find(a => a.type === 'PHQ9') ?? null
          const latestGAD7 = asmts.find(a => a.type === 'GAD7') ?? null
          const latestPSS10 = asmts.find(a => a.type === 'PSS10') ?? null
          return {
            uid,
            email: data.email ?? `${uid.slice(0, 8)}…`,
            streak: calcStreak(records),
            records, latestPHQ9, latestGAD7, latestPSS10,
            allAssessments: asmts,
            isHighRisk: latestPHQ9 !== null && latestPHQ9.score >= 10,
            hasNegativeStreak: hasNegStreak(records),
          }
        })
      )
    } catch (e) {
      console.error(e)
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงและลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  function selectUser(u: UserData) { setTab('PHQ9'); setSelected(u) }

  const filtered = users.filter(u => {
    if (!u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter === 'high') return u.isHighRisk
    if (statusFilter === 'warn') return !u.isHighRisk && u.hasNegativeStreak
    if (statusFilter === 'ok') return !u.isHighRisk && !u.hasNegativeStreak
    return true
  })
  const atRiskCount = users.filter(u => u.isHighRisk).length
  const warnCount = users.filter(u => !u.isHighRisk && u.hasNegativeStreak).length

  function toggleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); setPage(1) }
    else if (sortDir === 'asc') { setSortDir('desc'); setPage(1) }
    else { setSortKey(null); setSortDir('asc'); setPage(1) }
  }

  const sortIcon = (col: string) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline shrink-0" />
    if (sortDir === 'asc') return <ChevronUp size={13} className="text-[#2d5a27] ml-1 inline shrink-0" />
    return <ChevronDown size={13} className="text-[#2d5a27] ml-1 inline shrink-0" />
  }

  const getLastDate = (u: UserData) =>
    u.records.length > 0 ? [...u.records].sort((a, b) => b.date.localeCompare(a.date))[0].date : ''

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortKey) return 0
    let va: number | string = 0, vb: number | string = 0
    if (sortKey === 'streak') { va = a.streak; vb = b.streak }
    else if (sortKey === 'lastRecord') { va = getLastDate(a); vb = getLastDate(b) }
    else if (sortKey === 'phq9') { va = a.latestPHQ9?.score ?? -1; vb = b.latestPHQ9?.score ?? -1 }
    else if (sortKey === 'gad7') { va = a.latestGAD7?.score ?? -1; vb = b.latestGAD7?.score ?? -1 }
    else if (sortKey === 'pss10') { va = a.latestPSS10?.score ?? -1; vb = b.latestPSS10?.score ?? -1 }
    else if (sortKey === 'email') return sortDir === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize))
  const pagedFiltered = sortedFiltered.slice((page - 1) * pageSize, page * pageSize)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="text-[#2d5a27] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="font-medium text-gray-800 mb-1">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button onClick={loadData} className="bg-[#2d5a27] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    const sortedRec = [...selected.records].sort((a, b) => b.date.localeCompare(a.date))
    const tabAsmts = selected.allAssessments.filter(a => a.type === tab)
    const risk = selected.isHighRisk ? 'high' : selected.hasNegativeStreak ? 'warn' : 'ok'

    return (
      <div className="min-h-screen bg-[#f5f0eb]">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setSelected(null)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-9 h-9 bg-[#2d5a27]/10 rounded-full flex items-center justify-center shrink-0">
                <Users size={16} className="text-[#2d5a27]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{selected.email}</p>
                <p className="text-xs text-gray-400">UID: {selected.uid}</p>
              </div>
            </div>
            {risk === 'high' && (
              <span className="shrink-0 flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                <AlertTriangle size={12} /> ความเสี่ยงสูง
              </span>
            )}
            {risk === 'warn' && (
              <span className="shrink-0 flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                <Activity size={12} /> เฝ้าระวัง
              </span>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
              <p className="text-xs text-gray-400 mb-1">ความต่อเนื่อง</p>
              <p className="text-2xl font-bold text-orange-500">{selected.streak}</p>
              <p className="text-xs text-gray-400 mt-0.5">วัน</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
              <p className="text-xs text-gray-400 mb-1">จำนวนบันทึก</p>
              <p className="text-2xl font-bold text-[#2d5a27]">{selected.records.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">รายการ</p>
            </div>
            {(['latestPHQ9', 'latestGAD7', 'latestPSS10'] as const).map(key => {
              const a = selected[key]
              const label = key === 'latestPHQ9' ? 'PHQ-9' : key === 'latestGAD7' ? 'GAD-7' : 'PSS-10'
              if (!a) return (
                <div key={key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 opacity-40">
                  <p className="text-xs text-gray-400 mb-1">{label} ล่าสุด</p>
                  <p className="text-xl font-bold text-gray-300">—</p>
                  <p className="text-xs text-gray-300 mt-0.5">ยังไม่ได้ทำ</p>
                </div>
              )
              const col = scoreColor(a.type, a.score)
              const isRed = col.startsWith('text-red')
              return (
                <div key={key} className={`rounded-2xl p-4 shadow-sm border ${isRed ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50'}`}>
                  <p className="text-xs text-gray-400 mb-1">{label} ล่าสุด</p>
                  <p className={`text-2xl font-bold ${isRed ? 'text-red-600' : 'text-gray-800'}`}>{a.score}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.label}</p>
                </div>
              )
            })}
          </div>

          {/* Risk alert */}
          {risk !== 'ok' && (
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${risk === 'high' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${risk === 'high' ? 'text-red-600' : 'text-orange-600'}`} />
              <p className={`text-sm font-medium ${risk === 'high' ? 'text-red-700' : 'text-orange-700'}`}>
                {risk === 'high'
                  ? 'ผู้ใช้มีคะแนน PHQ-9 ≥ 10 ควรได้รับการพูดคุยหรือส่งต่อผู้เชี่ยวชาญ'
                  : 'ผู้ใช้มีอารมณ์ด้านลบต่อเนื่องกัน 3 วันขึ้นไป ควรติดตามอย่างใกล้ชิด'}
              </p>
            </div>
          )}

          {/* Chart + Records */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm">แนวโน้มความเครียด 30 วัน</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2d5a27] inline-block" /> อารมณ์ปกติ
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> อารมณ์ด้านลบ
                  </span>
                </div>
              </div>
              <canvas ref={canvasRef} className="w-full" style={{ height: '200px' }} />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h3 className="font-bold text-gray-800 text-sm mb-3">บันทึกล่าสุด</h3>
              <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                {sortedRec.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีบันทึก</p>
                  : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 font-medium">วันที่</th>
                          <th className="text-left pb-2 font-medium">อารมณ์</th>
                          <th className="text-left pb-2 font-medium">เครียด</th>
                          <th className="text-left pb-2 font-medium">เรื่อง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRec.slice(0, 20).map((r, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${NEGATIVE_EMOTIONS.has(r.emotion) ? 'bg-red-50/40' : ''}`}>
                            <td className="py-1.5 text-gray-500">{r.date}</td>
                            <td className="py-1.5">
                              <span className={NEGATIVE_EMOTIONS.has(r.emotion) ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                {EMOTION_TH[r.emotion] ?? r.emotion}
                              </span>
                            </td>
                            <td className="py-1.5 text-gray-600">{r.stress}/10</td>
                            <td className="py-1.5 text-gray-500">{TOPIC_TH[r.topic] ?? r.topic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            </div>
          </div>

          {/* Assessment history */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm mb-4">ประวัติผลการประเมิน</h3>
            <div className="flex gap-2 mb-4">
              {(['PHQ9', 'GAD7', 'PSS10'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${tab === t ? 'bg-[#2d5a27] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tabAsmts.length === 0
              ? <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีประวัติ {tab}</p>
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">วันที่</th>
                      <th className="text-left pb-2 font-medium">คะแนน</th>
                      <th className="text-left pb-2 font-medium">ระดับ</th>
                      <th className="text-left pb-2 font-medium">แนวโน้ม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabAsmts.map((a, i) => {
                      const prev = tabAsmts[i + 1]
                      const diff = prev ? a.score - prev.score : null
                      return (
                        <tr key={a.id} className="border-b border-gray-50">
                          <td className="py-2 text-gray-500 text-xs">{a.date}</td>
                          <td className="py-2">
                            <span className={`font-bold px-2 py-0.5 rounded-lg text-sm ${scoreColor(a.type, a.score)}`}>
                              {a.score}
                            </span>
                          </td>
                          <td className="py-2 text-gray-700 text-xs">{a.label}</td>
                          <td className="py-2">
                            {diff !== null && (
                              <span className={`text-xs font-medium ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {diff < 0 ? `↓ ${Math.abs(diff)}` : diff > 0 ? `↑ ${diff}` : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      </div>
    )
  }

  // ── Table view ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
            <div className="w-10 h-10 bg-[#2d5a27] rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800">แดชบอร์ด</h1>
              <p className="hidden sm:block text-xs text-gray-400">MindBloom Admin · {users.length} บัญชีผู้ใช้</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={loadData}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => buildCSV(filtered)}
              className="hidden sm:flex items-center gap-2 bg-[#2d5a27] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1e3d1a] transition-colors"
            >
              <Download size={15} /> ส่งออก CSV
            </button>
            <button
              onClick={() => signOut(auth)}
              className="hidden sm:flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <LogOut size={15} /> ออกจากระบบ
            </button>
            <div className="relative sm:hidden">
              <button
                onClick={() => setShowMobileMenu(v => !v)}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <MoreVertical size={16} className="text-gray-600" />
              </button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-40 overflow-hidden">
                    <button
                      onClick={() => { buildCSV(filtered); setShowMobileMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download size={15} className="text-gray-400" /> ส่งออก CSV
                    </button>
                    <button
                      onClick={() => { signOut(auth); setShowMobileMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#2d5a27]/10 rounded-xl flex items-center justify-center">
                <Users size={17} className="text-[#2d5a27]" />
              </div>
              <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
            </div>
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-400 mt-1">บัญชีที่ลงทะเบียน</p>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm border ${atRiskCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${atRiskCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle size={17} className={atRiskCount > 0 ? 'text-red-600' : 'text-gray-400'} />
              </div>
              <p className={`text-sm font-medium ${atRiskCount > 0 ? 'text-red-700' : 'text-gray-600'}`}>ความเสี่ยงสูง</p>
            </div>
            <p className={`text-3xl font-bold ${atRiskCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{atRiskCount}</p>
            <p className="text-xs text-gray-400 mt-1">PHQ-9 ≥ 10</p>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm border ${warnCount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${warnCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Activity size={17} className={warnCount > 0 ? 'text-orange-600' : 'text-gray-400'} />
              </div>
              <p className={`text-sm font-medium ${warnCount > 0 ? 'text-orange-700' : 'text-gray-600'}`}>เฝ้าระวัง</p>
            </div>
            <p className={`text-3xl font-bold ${warnCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{warnCount}</p>
            <p className="text-xs text-gray-400 mt-1">อารมณ์ลบต่อเนื่อง 3 วัน</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50 flex items-center gap-3">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหาผู้ใช้ด้วยอีเมล..."
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'all', label: 'ทั้งหมด', count: users.length },
            { key: 'high', label: 'ความเสี่ยงสูง', count: atRiskCount },
            { key: 'warn', label: 'เฝ้าระวัง', count: warnCount },
            { key: 'ok', label: 'ปกติ', count: users.length - atRiskCount - warnCount },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === f.key
                  ? f.key === 'high' ? 'bg-red-600 text-white'
                    : f.key === 'warn' ? 'bg-orange-500 text-white'
                    : f.key === 'ok' ? 'bg-green-700 text-white'
                    : 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === f.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors" onClick={() => toggleSort('email')}>
                    <span className="flex items-center gap-0.5">ผู้ใช้{sortIcon('email')}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('streak')}>
                    <span className="flex items-center gap-0.5">ความต่อเนื่อง{sortIcon('streak')}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('lastRecord')}>
                    <span className="flex items-center gap-0.5">บันทึกล่าสุด{sortIcon('lastRecord')}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('phq9')}>
                    <span className="flex items-center gap-0.5">PHQ-9{sortIcon('phq9')}</span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('gad7')}>
                    <span className="flex items-center gap-0.5">GAD-7{sortIcon('gad7')}</span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('pss10')}>
                    <span className="flex items-center gap-0.5">PSS-10{sortIcon('pss10')}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">สถานะ</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 text-sm py-14">
                      {search ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีข้อมูลผู้ใช้'}
                    </td>
                  </tr>
                ) : pagedFiltered.map(u => {
                  const last = u.records.length > 0
                    ? [...u.records].sort((a, b) => b.date.localeCompare(a.date))[0]
                    : null
                  const rowBg = u.isHighRisk
                    ? 'bg-red-50/80 hover:bg-red-100/70'
                    : u.hasNegativeStreak
                      ? 'bg-orange-50/60 hover:bg-orange-100/60'
                      : 'hover:bg-gray-50'
                  return (
                    <tr
                      key={u.uid}
                      onClick={() => selectUser(u)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${rowBg}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2d5a27]/10 flex items-center justify-center shrink-0">
                            <Users size={14} className="text-[#2d5a27]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-48">{u.email}</p>
                            <p className="text-xs text-gray-400">{u.records.length} บันทึก</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-orange-500 font-bold">{u.streak}</span>
                        <span className="text-xs text-gray-400 ml-1">วัน</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {last ? (
                          <div>
                            <p className={`font-medium text-xs ${NEGATIVE_EMOTIONS.has(last.emotion) ? 'text-red-600' : 'text-gray-700'}`}>
                              {EMOTION_TH[last.emotion] ?? last.emotion}
                            </p>
                            <p className="text-xs text-gray-400">{last.date}</p>
                            {last.journal && (
                              <p className="text-xs text-gray-400 mt-0.5 max-w-44 truncate">{last.journal}</p>
                            )}
                          </div>
                        ) : <span className="text-xs text-gray-300">ไม่มีข้อมูล</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.latestPHQ9 ? (
                          <div>
                            <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${scoreColor('PHQ9', u.latestPHQ9.score)}`}>
                              {u.latestPHQ9.score}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">{u.latestPHQ9.label}</p>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5">
                        {u.latestGAD7 ? (
                          <div>
                            <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${scoreColor('GAD7', u.latestGAD7.score)}`}>
                              {u.latestGAD7.score}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">{u.latestGAD7.label}</p>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5">
                        {u.latestPSS10 ? (
                          <div>
                            <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${scoreColor('PSS10', u.latestPSS10.score)}`}>
                              {u.latestPSS10.score}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">{u.latestPSS10.label}</p>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          {u.isHighRisk && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <AlertTriangle size={9} /> เสี่ยงสูง
                            </span>
                          )}
                          {u.hasNegativeStreak && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <Activity size={9} /> เฝ้าระวัง
                            </span>
                          )}
                          {!u.isHighRisk && !u.hasNegativeStreak && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              ปกติ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sortedFiltered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>แถวต่อหน้า:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 outline-none cursor-pointer"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-gray-500">หน้า {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {sortedFiltered.length} จาก {users.length} ผู้ใช้
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
