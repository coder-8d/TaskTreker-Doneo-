import { useEffect, useState } from 'react'
import { formatClock, formatRussianDate } from '../lib/ruDate.js'

// Локальное время устройства, обновляется каждую секунду.
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="clock" aria-live="off">
      <time className="clock__time" dateTime={now.toISOString()}>
        {formatClock(now)}
      </time>
      <span className="clock__date">{formatRussianDate(now)}</span>
    </div>
  )
}