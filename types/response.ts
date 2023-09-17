interface CustomResponse<T> {
	hasError: boolean;
	message: string;
	error?: string;
	data?: T;
}
