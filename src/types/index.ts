export type EmotionName =
  | 'Happy' | 'Sad' | 'Anxious' | 'Angry' | 'Calm' | 'Tired'
  | 'Amazed' | 'Amused' | 'Brave' | 'Confident' | 'Content'
  | 'Excited' | 'Grateful' | 'Hopeful' | 'Joyful' | 'Passionate'
  | 'Peaceful' | 'Proud' | 'Relieved' | 'Satisfied'
  | 'Indifferent' | 'Surprised' | 'Confused' | 'Curious' | 'Nostalgic' | 'Bored'
  | 'Annoyed' | 'Ashamed' | 'Disappointed' | 'Discouraged' | 'Disgusted'
  | 'Drained' | 'Embarrassed' | 'Frustrated' | 'Guilty' | 'Hopeless'
  | 'Irritated' | 'Jealous' | 'Lonely' | 'Overwhelmed' | 'Scared'
  | 'Stressed' | 'Worried'

// เปลี่ยนจาก emoji string → icon name สำหรับ Lucide
export interface Emotion {
  name: EmotionName
  icon: string        // Lucide icon name เช่น 'Smile', 'CloudRain'
  iconColor: string   // Tailwind class เช่น 'text-yellow-500'
  label: string
  weatherIcon: string // Lucide icon name สำหรับ weather
  color: string       // Tailwind bg+border class
}

export interface DailyRecord {
  date: string
  stress: number
  emotion: EmotionName
  topic: string
  journal: string
  timestamp: number
}

export interface BuddyState {
  happiness: number
  growth: number
  level: number
  streak: number
  points: number
  lastCheckIn: string
  avatarSrc: string
  equippedItems: string[]
  ownedItems: string[]
  ownedAvatars: string[]
  completedQuestDate: string
  completedQuestIds: string[]
}

// ผลแบบทดสอบที่บันทึกลง Firestore
export interface AssessmentRecord {
  id: string                        // auto-generated timestamp id
  type: 'PHQ9' | 'GAD7' | 'PSS10'
  score: number
  label: string                     // เช่น 'ปกติ', 'ซึมเศร้าเล็กน้อย'
  answers: number[]
  date: string                      // 'YYYY-MM-DD'
  timestamp: number
}

export type PageName =
  | 'buddy' | 'checkin' | 'history' | 'rewards' | 'insights'