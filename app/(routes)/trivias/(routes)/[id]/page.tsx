import { Trivia, TriviaQuestion } from "@/types/trivia";
import { sortArrayRandomly } from "@/utils/array";
import { API_URL } from "@/utils/server";
import TriviaGame from "../../components/TriviaGame";

/** Return the trivia corresponding to the ID, from the back-end. */
async function getTriviaById(id: string): Promise<Trivia> {
	console.log(id);
	const response = await fetch(API_URL.concat(`/trivias/${id}`), {
		next: { revalidate: 3600 },
	});
	const body = (await response.json()) as CustomResponse<Trivia>;

	if (typeof body.data === "undefined" || body.hasError) {
		throw new Error(body.error ?? body.message);
	}

	return body.data;
}

export default async function TriviaPage({
	params,
}: { params: { id: string } }): Promise<JSX.Element> {
	const triviaData = await getTriviaById(params.id);
	const questions = sortArrayRandomly<TriviaQuestion>(triviaData.questions);

	return (
		<main className="mx-4">
			<TriviaGame
				id={triviaData.id}
				name={triviaData.name}
				questions={questions}
			/>
		</main>
	);
}
