import axios from 'axios';

export async function bigApiRequest(method: string, endpoint: string, data: any) {
	try {
		const response = await axios({
			method,
			url: endpoint,
			headers: { 'Content-Type': 'application/json' },
			data,
		});

		return response.data;
	} catch (error: any) {
		throw new Error(`Erro BigAPI: ${error.response?.data || error.message}`);
	}
}
