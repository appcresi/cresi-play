export function sortArrayRandomly<T>(array: Array<T>): Array<T> {
	return array.sort(() => Math.random() - 0.5);
}
