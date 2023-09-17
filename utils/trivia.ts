import { TriviaStatus } from "@/types/trivia";

export function getTriviaStatus(id: string): TriviaStatus | undefined {
	const localStatus = localStorage.getItem(`trivia-${id}`);

	if (localStatus) {
		const status = JSON.parse(localStatus) as TriviaStatus;
		return status;
	}
}

export function saveTriviaStatus(data: TriviaStatus): void {
	localStorage.setItem(`trivia-${data.id}`, JSON.stringify(data));
}
