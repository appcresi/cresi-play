export function sortArrayRandomly<T> (array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5)
}

function formatApiUrl (): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  if (typeof API_URL === 'undefined') {
    throw new Error('API_URL is not defined')
  }

  return API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
}

export const API_URL = formatApiUrl()
