import { Construct } from 'constructs';
import * as url from 'node:url';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { PROJECT_NAME } from '../../constant';

type AdminQueriesApiPros = {
	userPool: UserPool;
	userPoolClients?: cognito.IUserPoolClient[];
	allowGroups: string[];
	cors?: apigwv2.CorsPreflightOptions;
};

export class AdminQueriesApi extends Construct {
	public readonly url: string;
	public readonly api: apigwv2.HttpApi;
	public readonly handler: lambda.NodejsFunction;

	constructor(scope: Construct, id: string, props: AdminQueriesApiPros) {
		super(scope, id);

		// 创建 Lambda 函数
		const handler = new lambda.NodejsFunction(this, `${PROJECT_NAME}AdminQueries`, {
			runtime: Runtime.NODEJS_20_X,
			entry: url.fileURLToPath(new URL('api-handler/handler.ts', import.meta.url)),
			environment: {
				COGNITO_USER_POOL_ID: props.userPool.userPoolId,
				ALLOWED_GROUPS: JSON.stringify(props.allowGroups),
			},
		});

		handler.addToRolePolicy(
			new iam.PolicyStatement({
				actions: [
					'cognito-idp:AdminCreateUser',
					'cognito-idp:ListUsersInGroup',
					'cognito-idp:AdminUserGlobalSignOut',
					'cognito-idp:AdminEnableUser',
					'cognito-idp:AdminDisableUser',
					'cognito-idp:AdminRemoveUserFromGroup',
					'cognito-idp:AdminAddUserToGroup',
					'cognito-idp:AdminListGroupsForUser',
					'cognito-idp:AdminGetUser',
					'cognito-idp:AdminConfirmSignUp',
					'cognito-idp:ListUsers',
					'cognito-idp:ListGroups',
					'cognito-idp:AdminDeleteUser',
					'cognito-idp:AdminUpdateUserAttributes',
					'cognito-idp:AdminDeleteUserAttributes',
				],
				resources: [props.userPool.userPoolArn],
			})
		);

		const integration = new HttpLambdaIntegration('Integration', handler);

		const api = new apigwv2.HttpApi(this, `${PROJECT_NAME}HttpApi`, {
			apiName: `${PROJECT_NAME}AdminQueries`,
			defaultAuthorizer: new authorizers.HttpUserPoolAuthorizer('Authorizer', props.userPool, {
				userPoolClients: props.userPoolClients,
				identitySource: ['$request.header.Authorization'],
			}),
			defaultIntegration: integration,
			corsPreflight: {
				allowOrigins: ['*'],
				allowHeaders: ['*'],
				allowMethods: [apigwv2.CorsHttpMethod.ANY],
				exposeHeaders: ['Access-Control-Allow-Origin'],
				allowCredentials: false,
			},
			// disableExecuteApiEndpoint: false,
		});

		// 设置无权限OPTIONS
		api.addRoutes({
			path: '/{proxy+}',
			methods: [apigwv2.HttpMethod.OPTIONS],
			authorizer: new apigwv2.HttpNoneAuthorizer(),
			integration: new HttpLambdaIntegration(
				'OptionLambdaIntegration',
				new lambda.NodejsFunction(this, 'OptionLambda', {
					runtime: Runtime.NODEJS_20_X,
					entry: url.fileURLToPath(new URL('cors-handler/handler.ts', import.meta.url)),
					// role: props.role,
				})
			),
		});

		// this should never happen but "url" is string | undefined
		if (!api.url) {
			throw new Error('Something went wrong configuring the API URL');
		}

		this.api = api;
		this.handler = handler;
		this.url = api.url;
	}
}
