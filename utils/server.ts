function formatApiUrl(): string {
	const API_URL = process.env.API_URL;

	if (!API_URL) {
		throw new Error("API_URL is not defined");
	}

	return API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
}

export const API_URL = formatApiUrl();
