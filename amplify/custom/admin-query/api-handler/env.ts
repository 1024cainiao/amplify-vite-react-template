import { create, coerce, type, string, array } from 'superstruct';

export const ProcessEnv = type({
	COGNITO_USER_POOL_ID: string(),
	ALLOWED_GROUPS: coerce(array(string()), string(), (value) => JSON.parse(value)),
});

// error early if env vars are not set
export const env = create(process.env, ProcessEnv, 'Unable to validate expected environment variables');
