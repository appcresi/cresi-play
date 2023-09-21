import { GameSettings } from '@/app/(routes)/trivias/types/settings'
import { TriviaStatus } from '@/types/trivia'

export function getTriviaStatus (id: string): TriviaStatus | undefined {
  const localStatus = localStorage.getItem(`trivia-${id}`)

  if (localStatus !== null) {
    const status = JSON.parse(localStatus) as TriviaStatus
    return status
  }
}

export function saveTriviaStatus (data: TriviaStatus): void {
  localStorage.setItem(`trivia-${data.id}`, JSON.stringify(data))
}

export function getSettings (): GameSettings | undefined {
  if (typeof window !== 'undefined') {
    const localSettings = localStorage.getItem('settings')

    if (localSettings !== null) {
      const settings = JSON.parse(localSettings) as GameSettings
      return settings
    }
  }
}

export function saveSettings (settings: GameSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('settings', JSON.stringify(settings))
  }
}
