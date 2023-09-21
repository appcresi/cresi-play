import { useEffect, useState } from 'react'

interface SettingsHook {
  settings: GameSettings | undefined
  setSettings: (settings: GameSettings) => void
}

export function useSettings (): SettingsHook {
  const [settings, setSettings] = useState<GameSettings>()

  /* Get local settings, if exist */
  useEffect(() => {
    const localSettings = localStorage.getItem('settings')

    if (localSettings) {
      setSettings(JSON.parse(localSettings) as GameSettings)
    }
  }, [])

  /* Store settings locally on change */
  useEffect(() => {
    if (settings != null) {
      localStorage.setItem('settings', JSON.stringify(settings))
    }
  }, [settings])

  return { settings, setSettings }
}
