import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Stack } from 'aws-cdk-lib/core';
import * as url from 'node:url';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

type PostConfirmationPros = {
	userPool: cognito.UserPool;
};

export class AuthTrigger extends Construct {
	constructor(scope: Stack, id: string, props: PostConfirmationPros) {
		super(scope, id);
		// create the PostConfirmation trigger
		const postConfirmationTrigger = new lambda.NodejsFunction(scope, 'PostConfirmation', {
			runtime: Runtime.NODEJS_20_X,
			entry: url.fileURLToPath(new URL('post-confirmation.ts', import.meta.url)),
			// role: userPool.userPoolArn,
		});
		postConfirmationTrigger.addToRolePolicy(
			new PolicyStatement({
				actions: [
					// 添加所需的操作，例如访问 Cognito 用户池的权限
					'cognito-idp:AdminAddUserToGroup',
				],
				resources: ['*'],
			})
		);

		props.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationTrigger);

		const preTokenGenTrigger = new lambda.NodejsFunction(scope, 'PreTokenGen', {
			runtime: Runtime.NODEJS_20_X,
			entry: url.fileURLToPath(new URL('pre-token-gen.ts', import.meta.url)),
			// role: userPool.userPoolArn,
		});

		props.userPool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION, preTokenGenTrigger);
	}
}
