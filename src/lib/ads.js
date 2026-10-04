// Рекламные креативы. Заменяются на реальные без изменения кода:
// останется только поменять массив ADS.
export const ADS = [
  {
    id: 'visa-fifa',
    kind: 'video',
    brand: 'Visa',
    titleKey: 'ads.creatives.visaTitle',
    textKey: 'ads.creatives.visaText',
    ctaKey: 'ads.creatives.cta',
    videoUrl: 'https://www.youtube.com/watch?v=Visa-FIFA-WorldCup-2026',
    tone: 'visa',
  },
  {
    id: 'world-cup',
    kind: 'banner',
    brand: 'FIFA World Cup 2026™',
    titleKey: 'ads.creatives.worldCupTitle',
    textKey: 'ads.creatives.worldCupText',
    ctaKey: 'ads.creatives.cta',
    videoUrl: 'https://www.youtube.com/watch?v=FIFA-WorldCup-2026',
    tone: 'fifa',
  },
  {
    id: 'doneo-plus',
    kind: 'banner',
    brand: 'Doneo',
    titleKey: 'ads.creatives.doneoTitle',
    textKey: 'ads.creatives.doneoText',
    ctaKey: 'ads.creatives.cta',
    to: '#/pricing',
    tone: 'doneo',
  },
]

// Креативы по кругу — показывает следующий.
export function nextAd(currentIndex) {
  if (ADS.length === 0) return null
  return ADS[(currentIndex + 1) % ADS.length]
}
