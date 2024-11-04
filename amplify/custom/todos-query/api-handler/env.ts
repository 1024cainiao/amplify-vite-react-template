import { create, type, string } from 'superstruct';

export const ProcessEnv = type({
	ES_HOST: string(),
});

// error early if env vars are not set
export const env = create(process.env, ProcessEnv, 'Unable to validate expected environment variables');
