import type { Struct } from 'superstruct';
import type { MiddlewareHandler } from 'hono';
import type { LambdaEvent, LambdaContext } from 'hono/aws-lambda';
import {
	CognitoIdentityProviderClient,
	AdminAddUserToGroupCommand,
	AdminConfirmSignUpCommand,
	AdminDisableUserCommand,
	AdminEnableUserCommand,
	AdminGetUserCommand,
	AdminListGroupsForUserCommand,
	AdminRemoveUserFromGroupCommand,
	AdminUserGlobalSignOutCommand,
	ListGroupsCommand,
	ListUsersCommand,
	ListUsersInGroupCommand,
	AdminCreateUserCommand,
	InvalidPasswordException,
	UsernameExistsException,
	AdminDeleteUserCommand,
	AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validator } from 'hono/validator';
import { is, object, string, number, optional } from 'superstruct';
import { env } from './env';

// https://hono.dev/getting-started/aws-lambda#access-aws-lambda-object
type Bindings = {
	event: LambdaEvent;
	context: LambdaContext;
};

export const app = new Hono<{ Bindings: Bindings }>();

const cognito = new CognitoIdentityProviderClient();

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

/**
 * middleware to verify caller's Cognito User Pool Group
 */
function group(): MiddlewareHandler<{ Bindings: Bindings }> {
	return async function (c, next) {
		// check if request context is ApiGatewayProxyEventV2
		console.log('event request context');
		try {
			if (c.env.event.requestContext) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				const claims = c.env.event.requestContext.authorizer.jwt.claims;
				const groups = claims['cognito:groups'];
				if (env.ALLOWED_GROUPS.some((item) => groups.indexOf(item) != -1)) {
					return next();
				}
			}
		} catch (e) {
			console.log(e);
		}
		return c.text(`User does not have permissions to perform administrative tasks`, 400);
	};
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
app.use('*', group());
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	c.res.headers.set('X-Response-Time', `${end - start}`);
});

app.post(
	'/add-user-to-group',
	validate(
		object({
			username: string(),
			group: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminAddUserToGroupCommand({
			GroupName: body.group,
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/remove-user-from-group',
	validate(
		object({
			username: string(),
			group: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminRemoveUserFromGroupCommand({
			GroupName: body.group,
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/confirm-user-signup',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminConfirmSignUpCommand({
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/disable-user',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminDisableUserCommand({
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/enable-user',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminEnableUserCommand({
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/create-user',
	validate(
		object({
			username: string(),
			password: string(),
			group: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		try {
			const command = new AdminCreateUserCommand({
				Username: body.username,
				TemporaryPassword: body.password,
				UserPoolId: env.COGNITO_USER_POOL_ID,
				UserAttributes: [
					{ Name: 'email', Value: body.username }, // 可选，指定其他用户属性
				],
			});
			const response = await cognito.send(command);
			const command2 = new AdminAddUserToGroupCommand({
				GroupName: body.group,
				Username: body.username,
				UserPoolId: env.COGNITO_USER_POOL_ID,
			});
			await cognito.send(command2);
			return c.json(response);
		} catch (e) {
			if (e instanceof InvalidPasswordException) {
				return c.json({ message: 'パスワードルールが間違っています' }, 400);
			} else if (e instanceof UsernameExistsException) {
				return c.json({ message: 'ユーザー名は既に存在します' }, 400);
			}
			return c.json({ message: e }, 400);
		}
	}
);

app.get(
	'/get-user/:username',
	validateParam(
		object({
			username: string(),
		})
	),
	async (c) => {
		const username = c.req.param('username');
		const command = new AdminGetUserCommand({
			Username: username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.get('/list-users', async (c) => {
	const command = new ListUsersCommand({
		UserPoolId: env.COGNITO_USER_POOL_ID,
	});
	const response = await cognito.send(command);
	return c.json(response);
});

app.get('/list-groups', async (c) => {
	const command = new ListGroupsCommand({
		UserPoolId: env.COGNITO_USER_POOL_ID,
	});
	const response = await cognito.send(command);
	return c.json(response);
});

app.post(
	'/list-groups-for-user',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		const body = await c.req.json();
		const command = new AdminListGroupsForUserCommand({
			Username: body.username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/list-users-in-group',
	validate(
		object({
			group: string(),
			limit: number(),
			nextToken: optional(string()),
		})
	),
	async (c) => {
		const { group, limit, nextToken } = await c.req.json();
		const command = new ListUsersInGroupCommand({
			GroupName: group,
			Limit: limit,
			NextToken: nextToken,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/sign-user-out',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		const { username } = await c.req.json();
		const command = new AdminUserGlobalSignOutCommand({
			Username: username,
			UserPoolId: env.COGNITO_USER_POOL_ID,
		});
		const response = await cognito.send(command);
		return c.json(response);
	}
);

app.post(
	'/delete-user',
	validate(
		object({
			username: string(),
		})
	),
	async (c) => {
		try {
			const { username } = await c.req.json();
			const command = new AdminDeleteUserCommand({
				Username: username,
				UserPoolId: env.COGNITO_USER_POOL_ID,
			});
			const response = await cognito.send(command);
			return c.json(response);
		} catch (e) {
			return c.json({ message: e }, 400);
		}
	}
);

app.post(
	'/update-user-attributes',
	validate(
		object({
			username: string(),
			role: string(),
		})
	),
	async (c) => {
		try {
			const { username, role } = await c.req.json();
			const command = new AdminUpdateUserAttributesCommand({
				Username: username,
				UserPoolId: env.COGNITO_USER_POOL_ID,
				UserAttributes: [{ Name: 'custom:role', Value: role }],
			});
			const response = await cognito.send(command);
			return c.json(response);
		} catch (e) {
			return c.json({ message: e }, 400);
		}
	}
);
