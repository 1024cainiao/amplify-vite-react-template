import type {Struct} from 'superstruct';
import {is} from 'superstruct';
import {Hono} from 'hono';
import type {LambdaContext, LambdaEvent} from 'hono/aws-lambda';
import {cors} from 'hono/cors';
import {logger} from 'hono/logger';
import {validator} from 'hono/validator';
import {defaultProvider} from '@aws-sdk/credential-provider-node'; // V3 SDK.
import {Client} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';

// https://hono.dev/getting-started/aws-lambda#access-aws-lambda-object
type Bindings = {
	event: LambdaEvent;
	context: LambdaContext;
};

export const app = new Hono<{ Bindings: Bindings }>();

/**
 * Body validator
 */
function validate<T, S>(struct: Struct<T, S>) {
	return validator('json', (value, c) => {
		if (!is(value, struct)) {
			return c.json({ message: 'Invalid body' }, 400);
		}
		return value;
	});
}

/**
 * Body validatorParam
 */
function validateParam<T, S>(struct: Struct<T, S>) {
	return validator('param', (value, c) => {
		if (!is(value, struct)) {
			return c.text('Invalid body', 400);
		}
		return value;
	});
}

app.use('*', logger());
app.options('*', (c) => {
	return c.text('', 204);
});
app.use(
	'*',
	cors({
		origin: ['*'],
		allowHeaders: ['Authorization'],
		maxAge: 600,
	})
);
// middleware to check Cognito user group
// app.use('*', group());
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	c.res.headers.set('X-Response-Time', `${end - start}`);
});

const client = new Client({
	...AwsSigv4Signer({
		region: 'ap-northeast-1',
		service: 'es',
		// Must return a Promise that resolve to an AWS.Credentials object.
		// This function is used to acquire the credentials when the client start and
		// when the credentials are expired.
		// The Client will refresh the Credentials only when they are expired.
		// With AWS SDK V2, Credentials.refreshPromise is used when available to refresh the credentials.

		// Example with AWS SDK V2:
		getCredentials: () => {
			// Any other method to acquire a new Credentials object can be used.
			const credentialsProvider = defaultProvider();
			return credentialsProvider();
		},
	}),
	node: 'https://search-opensearchdomai-ep540pn3zg5n-qfacmrryqgsjsnvrvdi56isrne.ap-northeast-1.es.amazonaws.com', // OpenSearch domain URL
});

app.get(
	'/health',
	async (c) => {
		return c.json({message:'ok'});
	}
);

app.get(
	'/es',
	async (c) => {
		const res =  await client.cat.health()
		const response = {
			statusCode: 200,
			body: JSON.stringify(res.body),
		};
		return c.json(response);
	}
);