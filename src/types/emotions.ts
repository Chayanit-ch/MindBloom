import type { Emotion } from './index'

export const EMOTIONS: Emotion[] = [
  { name: 'Happy',   icon: 'Smile',      iconColor: 'text-yellow-500', label: 'Happy',   weatherIcon: 'Sun',       color: 'bg-yellow-100 border-yellow-300' },
  { name: 'Sad',     icon: 'CloudRain',  iconColor: 'text-blue-400',   label: 'Sad',     weatherIcon: 'CloudRain', color: 'bg-blue-100 border-blue-300' },
  { name: 'Anxious', icon: 'Zap',        iconColor: 'text-purple-500', label: 'Anxious', weatherIcon: 'CloudLightning', color: 'bg-purple-100 border-purple-300' },
  { name: 'Angry',   icon: 'Flame',      iconColor: 'text-red-500',    label: 'Angry',   weatherIcon: 'Wind',      color: 'bg-red-100 border-red-300' },
  { name: 'Calm',    icon: 'Leaf',       iconColor: 'text-green-500',  label: 'Calm',    weatherIcon: 'Cloud',     color: 'bg-green-100 border-green-300' },
  { name: 'Tired',   icon: 'Moon',       iconColor: 'text-gray-400',   label: 'Tired',   weatherIcon: 'CloudFog',  color: 'bg-gray-100 border-gray-300' },
]

export const ALL_EMOTIONS = [
  'Amazed', 'Amused', 'Angry', 'Annoyed', 'Anxious', 'Ashamed',
  'Brave', 'Bored',
  'Calm', 'Confident', 'Content', 'Confused', 'Curious',
  'Disappointed', 'Discouraged', 'Disgusted', 'Drained',
  'Embarrassed', 'Excited',
  'Frustrated', 'Grateful', 'Guilty',
  'Happy', 'Hopeful', 'Hopeless',
  'Indifferent', 'Irritated',
  'Jealous', 'Joyful',
  'Lonely',
  'Nostalgic',
  'Overwhelmed',
  'Passionate', 'Peaceful', 'Proud',
  'Relieved',
  'Sad', 'Satisfied', 'Scared', 'Stressed', 'Surprised',
  'Tired',
  'Worried',
]

// map emotion name → Lucide icon name + color
export const EMOTION_ICON: Record<string, { icon: string; color: string }> = {
  Amazed:       { icon: 'Star',         color: 'text-yellow-400' },
  Amused:       { icon: 'Laugh',        color: 'text-yellow-500' },
  Angry:        { icon: 'Flame',        color: 'text-red-500' },
  Annoyed:      { icon: 'Frown',        color: 'text-orange-400' },
  Anxious:      { icon: 'Zap',          color: 'text-purple-500' },
  Ashamed:      { icon: 'EyeOff',       color: 'text-gray-400' },
  Brave:        { icon: 'Shield',       color: 'text-blue-500' },
  Bored:        { icon: 'Minus',        color: 'text-gray-400' },
  Calm:         { icon: 'Leaf',         color: 'text-green-500' },
  Confident:    { icon: 'ThumbsUp',     color: 'text-blue-500' },
  Content:      { icon: 'CheckCircle',  color: 'text-green-400' },
  Confused:     { icon: 'HelpCircle',   color: 'text-gray-500' },
  Curious:      { icon: 'Search',       color: 'text-teal-500' },
  Disappointed: { icon: 'TrendingDown', color: 'text-gray-500' },
  Discouraged:  { icon: 'ArrowDown',    color: 'text-gray-400' },
  Disgusted:    { icon: 'X',            color: 'text-red-400' },
  Drained:      { icon: 'Battery',      color: 'text-gray-400' },
  Embarrassed:  { icon: 'AlertCircle',  color: 'text-pink-400' },
  Excited:      { icon: 'Sparkles',     color: 'text-yellow-500' },
  Frustrated:   { icon: 'AlertTriangle',color: 'text-orange-500' },
  Grateful:     { icon: 'Heart',        color: 'text-pink-500' },
  Guilty:       { icon: 'AlertCircle',  color: 'text-red-400' },
  Happy:        { icon: 'Smile',        color: 'text-yellow-500' },
  Hopeful:      { icon: 'Sunrise',      color: 'text-orange-400' },
  Hopeless:     { icon: 'CloudRain',    color: 'text-gray-500' },
  Indifferent:  { icon: 'Meh',          color: 'text-gray-400' },
  Irritated:    { icon: 'Zap',          color: 'text-orange-400' },
  Jealous:      { icon: 'Eye',          color: 'text-green-600' },
  Joyful:       { icon: 'Sun',          color: 'text-yellow-400' },
  Lonely:       { icon: 'User',         color: 'text-blue-300' },
  Nostalgic:    { icon: 'Clock',        color: 'text-purple-400' },
  Overwhelmed:  { icon: 'Layers',       color: 'text-red-400' },
  Passionate:   { icon: 'Flame',        color: 'text-orange-500' },
  Peaceful:     { icon: 'Wind',         color: 'text-teal-400' },
  Proud:        { icon: 'Award',        color: 'text-yellow-500' },
  Relieved:     { icon: 'CheckCircle',  color: 'text-green-500' },
  Sad:          { icon: 'CloudRain',    color: 'text-blue-400' },
  Satisfied:    { icon: 'ThumbsUp',     color: 'text-green-500' },
  Scared:       { icon: 'AlertTriangle',color: 'text-red-400' },
  Stressed:     { icon: 'Activity',     color: 'text-red-500' },
  Surprised:    { icon: 'Star',         color: 'text-yellow-400' },
  Tired:        { icon: 'Moon',         color: 'text-gray-400' },
  Worried:      { icon: 'HelpCircle',   color: 'text-orange-400' },
}

// weather icon สำหรับ History calendar
export const WEATHER_ICON: Record<number, { icon: string; color: string }> = {
  1:  { icon: 'CloudLightning', color: 'text-purple-500' },
  2:  { icon: 'CloudLightning', color: 'text-purple-400' },
  3:  { icon: 'CloudRain',      color: 'text-blue-400' },
  4:  { icon: 'CloudRain',      color: 'text-blue-300' },
  5:  { icon: 'Cloud',          color: 'text-gray-400' },
  6:  { icon: 'CloudSun',       color: 'text-gray-400' },
  7:  { icon: 'CloudSun',       color: 'text-yellow-400' },
  8:  { icon: 'Sun',            color: 'text-yellow-400' },
  9:  { icon: 'Sun',            color: 'text-yellow-500' },
  10: { icon: 'Sparkles',       color: 'text-yellow-500' },
}

export const TOPICS = [
  'Health', 'Fitness', 'Self-Care', 'Sleep', 'Appearance',
  'Hobbies', 'Identity', 'Spirituality', 'Future',
  'Community', 'Family', 'Friends', 'Partner', 'Dating', 'Social',
  'School/TCAS', 'Work', 'Education', 'Finance',
  'Travel', 'Weather', 'Current Events', 'Other',
]

export function getMoodLabel(level: number): string {
  if (level <= 2) return 'Very Difficult'
  if (level <= 4) return 'Difficult'
  if (level <= 6) return 'Okay'
  if (level <= 8) return 'Good'
  return 'Amazing'
}

export const EMOTION_TH: Record<string, string> = {
  Amazed: 'ประหลาดใจมาก', Amused: 'สนุกสนาน', Angry: 'โกรธ',
  Annoyed: 'หงุดหงิด', Anxious: 'วิตกกังวล', Ashamed: 'ละอายใจ',
  Brave: 'กล้าหาญ', Bored: 'เบื่อ',
  Calm: 'สงบ', Confident: 'มั่นใจ', Content: 'พอใจ',
  Confused: 'สับสน', Curious: 'อยากรู้',
  Disappointed: 'ผิดหวัง', Discouraged: 'ท้อแท้',
  Disgusted: 'รังเกียจ', Drained: 'หมดแรง',
  Embarrassed: 'อาย', Excited: 'ตื่นเต้น',
  Frustrated: 'หัวร้อน', Grateful: 'ขอบคุณ', Guilty: 'รู้สึกผิด',
  Happy: 'มีความสุข', Hopeful: 'มีความหวัง', Hopeless: 'สิ้นหวัง',
  Indifferent: 'เฉยๆ', Irritated: 'ระคายเคือง',
  Jealous: 'อิจฉา', Joyful: 'ยินดี',
  Lonely: 'เหงา',
  Nostalgic: 'คิดถึงอดีต',
  Overwhelmed: 'ท่วมท้น',
  Passionate: 'มุ่งมั่น', Peaceful: 'สงบสุข', Proud: 'ภูมิใจ',
  Relieved: 'โล่งใจ',
  Sad: 'เศร้า', Satisfied: 'พึงพอใจ', Scared: 'กลัว',
  Stressed: 'เครียด', Surprised: 'ตกใจ',
  Tired: 'เหนื่อย',
  Worried: 'เป็นห่วง',
}

export const TOPIC_TH: Record<string, string> = {
  'Health': 'สุขภาพ', 'Fitness': 'การออกกำลังกาย',
  'Self-Care': 'ดูแลตัวเอง', 'Sleep': 'การนอน',
  'Appearance': 'รูปลักษณ์', 'Hobbies': 'งานอดิเรก',
  'Identity': 'อัตลักษณ์', 'Spirituality': 'จิตใจ',
  'Future': 'อนาคต', 'Community': 'ชุมชน',
  'Family': 'ครอบครัว', 'Friends': 'เพื่อน',
  'Partner': 'คนรัก', 'Dating': 'ความรัก',
  'Social': 'สังคม', 'School/TCAS': 'เรียน/TCAS',
  'Work': 'งาน', 'Education': 'การศึกษา',
  'Finance': 'การเงิน',
  'Travel': 'การเดินทาง', 'Weather': 'สภาพอากาศ',
  'Current Events': 'เหตุการณ์ปัจจุบัน', 'Other': 'อื่นๆ',
}

export function getMoodLabelTH(level: number): string {
  if (level <= 2) return 'ยากมาก'
  if (level <= 4) return 'ยาก'
  if (level <= 6) return 'พอได้'
  if (level <= 8) return 'ดี'
  return 'ดีมาก'
}

export function getEmotionsByLevel(level: number): string[] {
  if (level <= 2) return [
    'Hopeless', 'Drained', 'Overwhelmed', 'Lonely', 'Sad',
    'Scared', 'Ashamed', 'Disgusted', 'Hopeless', 'Worried',
    'Discouraged', 'Guilty',
  ]
  if (level <= 4) return [
    'Anxious', 'Frustrated', 'Angry', 'Annoyed', 'Disappointed',
    'Embarrassed', 'Irritated', 'Jealous', 'Stressed', 'Tired',
    'Bored', 'Indifferent',
  ]
  if (level <= 6) return [
    'Calm', 'Confused', 'Curious', 'Nostalgic', 'Indifferent',
    'Surprised', 'Content', 'Relieved', 'Satisfied', 'Peaceful',
    'Tired', 'Bored',
  ]
  if (level <= 8) return [
    'Happy', 'Hopeful', 'Grateful', 'Confident', 'Proud',
    'Excited', 'Calm', 'Peaceful', 'Content', 'Relieved',
    'Satisfied', 'Amused',
  ]
  return [
    'Joyful', 'Amazed', 'Excited', 'Grateful', 'Proud',
    'Passionate', 'Brave', 'Hopeful', 'Happy', 'Confident',
    'Amused', 'Relieved',
  ]
}