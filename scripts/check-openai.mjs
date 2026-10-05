import { readFileSync } from 'node:fs'

const line = readFileSync('/Users/mark/Desktop/doneo/.env', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('OPENAI_API_KEY='))
const key = line.split('=')[1].trim()

console.log('ключ:', `${key.slice(0, 12)}…`, '| длина:', key.length)

try {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Скажи одно слово: работает' }],
      max_tokens: 20,
    }),
    signal: AbortSignal.timeout(45000),
  })

  const text = await res.text()
  console.log('HTTP', res.status)

  if (res.ok) {
    const data = JSON.parse(text)
    console.log('ответ:', data.choices[0].message.content)
    console.log('модель:', data.model)
    console.log('токенов:', JSON.stringify(data.usage))
  } else {
    console.log('тело ошибки:', text.slice(0, 700))
  }
} catch (error) {
  console.log('СЕТЬ:', error.name, error.message)
  if (error.cause) console.log('  причина:', error.cause.message || error.cause)
}