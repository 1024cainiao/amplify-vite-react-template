import {Construct} from 'constructs';
import * as url from 'node:url';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import {UserPool} from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {PROJECT_NAME} from '../../constant';

type TodosQueriesApiPros = {
	esArn: string;
	userPoolClients?: cognito.IUserPoolClient[];
	allowGroups: string[];
	cors?: apigwv2.CorsPreflightOptions;
};

export class TodosQueriesApi extends Construct {
	public readonly url: string;
	public readonly api: apigwv2.HttpApi;
	public readonly handler: lambda.NodejsFunction;

	constructor(scope: Construct, id: string, props: TodosQueriesApiPros) {
		super(scope, id);

		// 创建 Lambda 函数
		const handler = new lambda.NodejsFunction(this, `${PROJECT_NAME}TodosQueries`, {
			runtime: Runtime.NODEJS_20_X,
			entry: url.fileURLToPath(new URL('api-handler/handler.ts', import.meta.url)),
			environment:{
				ES_HOST:''
			}
		});

		handler.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ["es:ESHttp*"],
				resources: [`${props.esArn}/*`],
			})
		);

		const integration = new HttpLambdaIntegration('Integration', handler);

		const api = new apigwv2.HttpApi(this, `${PROJECT_NAME}HttpApi`, {
			apiName: `${PROJECT_NAME}TodosQueries`,
			// defaultAuthorizer: new authorizers.HttpUserPoolAuthorizer('Authorizer', props.userPool, {
			// 	userPoolClients: props.userPoolClients,
			// 	identitySource: ['$request.header.Authorization'],
			// }),
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
