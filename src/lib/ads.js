// Рекламные креативы. Заменяются на реальные без изменения кода:
// достаточно поменять массив ADS и обязательное время AD_SECONDS.
export const AD_SECONDS = 30

export const ADS = [
  {
    id: 'alfabank',
    brand: 'Альфа-Банк',
    titleKey: 'ads.creatives.alfaTitle',
    textKey: 'ads.creatives.alfaText',
    noteKey: 'ads.creatives.alfaNote',
    // Длительность самого ролика. Если меньше обязательного времени,
    // оставшееся время показывается чёрным экраном.
    duration: AD_SECONDS,
    tone: 'alfa',
  },
]

// Креативы по кругу — показывает следующий.
export function nextAd(currentIndex) {
  if (ADS.length === 0) return null
  return ADS[(currentIndex + 1) % ADS.length]
}

// Состояние полноэкранной рекламы на секунде `elapsed`.
//
// • пока идёт обязательное время — крестик недоступен;
// • если ролик закончился раньше — чёрный экран, отсчёт продолжается;
// • после отсчёта ролик начинается заново (по кругу) и появляется ✕;
// • автоматического закрытия нет — только по ✕.
export function adState(elapsed, ad) {
  const seconds = ad && ad.duration ? ad.duration : AD_SECONDS
  const contentDuration = Math.max(1, seconds)
  const mandatoryLeft = Math.max(0, AD_SECONDS - elapsed)
  const closable = mandatoryLeft === 0
  const contentFinished = elapsed >= contentDuration

  return {
    mandatoryLeft,
    closable,
    cycle: Math.floor(elapsed / contentDuration),
    // Чёрный экран нужен только пока ролик закончился, а таймер ещё идёт.
    blackout: contentFinished && !closable,
    progress: Math.min(100, (elapsed / AD_SECONDS) * 100),
  }
}

