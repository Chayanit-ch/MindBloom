const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const cache: Record<string, string> = {}
let lastCallTime = 0
const MIN_INTERVAL = 10000 // 10 วินาที ต่อ 1 call

export async function getCopingSuggestion(
    emotion: string,
    topic: string,
    stress: number
): Promise<string> {
    const cacheKey = `${emotion}-${topic}-${stress}`
    if (cache[cacheKey]) return cache[cacheKey]

    // throttle — ถ้าเพิ่งยิงไปไม่ถึง 10 วิ ให้รอก่อน
    const now = Date.now()
    const wait = MIN_INTERVAL - (now - lastCallTime)
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastCallTime = Date.now()

    const moodLevel = stress >= 7 ? 'ดี' : stress >= 5 ? 'พอได้' : 'ไม่ดี'

    const prompt = `คุณเป็นผู้ช่วยดูแลสุขภาพจิตที่เป็นมิตรและเข้าใจวัยรุ่นไทย
ผู้ใช้รู้สึก "${emotion}" ระดับอารมณ์ ${stress}/10 (โดย 1=แย่มาก, 10=ดีมาก) ภาพรวมอารมณ์วันนี้: ${moodLevel} สาเหตุจาก "${topic}"
แนะนำวิธีจัดการ 2-3 วิธี สั้นกระชับ เป็นกันเอง ทำได้จริง
ตอบภาษาไทย ไม่เกิน 5 ประโยค พูดเหมือนเพื่อนคุยกัน`

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
            })
        }
    )

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text
        ?? 'ขอบคุณที่แบ่งปันความรู้สึกนะครับ ลองพักผ่อนสักครู่ดูนะครับ 💚'

    cache[cacheKey] = result
    return result
}