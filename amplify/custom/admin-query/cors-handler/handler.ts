import { APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResult> => {
	const headers: { [header: string]: string } = {
		'Access-Control-Allow-Methods': 'OPTIONS',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Origin': '*', // allow all origins by default
	};

	headers['Access-Control-Allow-Origin'] = '*';

	return {
		statusCode: 204,
		headers: headers,
		body: '',
	};
};
