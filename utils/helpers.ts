// Fisher-Yates — no muta el array de entrada. Antes esto era
// `array.sort(() => Math.random() - 0.5)`, que además de mutar el array
// original produce una mezcla sesgada (no todas las permutaciones quedan
// igual de probables), un anti-patrón conocido para "shuffle".
export function sortArrayRandomly<T> (array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
