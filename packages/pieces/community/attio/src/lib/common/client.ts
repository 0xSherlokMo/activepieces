import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.attio.com/v2';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
	const response = await httpClient.sendRequest({
		method,
		url: `${BASE_URL}${path}`,
		headers: {
			'Authorization': `Bearer ${auth}`,
			'Content-Type': 'application/json',
		},
		body,
	});
	return response.body;
}
