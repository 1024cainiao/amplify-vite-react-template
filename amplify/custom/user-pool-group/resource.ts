import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { USER_POOL_GROUP_ADMINS, USER_POOL_GROUP_USERS } from '../../constant';

type PublicBucketPros = {
	userPool: UserPool;
	identityPoolId: string;
};

export class UserPollGroup extends Construct {
	constructor(scope: Construct, id: string, props: PublicBucketPros) {
		super(scope, id);

		new cognito.CfnUserPoolGroup(scope, 'GroupAdmins', {
			userPoolId: props.userPool.userPoolId,
			groupName: USER_POOL_GROUP_ADMINS,
			description: 'Group Admins',
			precedence: 0,
		});
		new cognito.CfnUserPoolGroup(scope, 'GroupUsers', {
			userPoolId: props.userPool.userPoolId,
			groupName: USER_POOL_GROUP_USERS,
			description: 'Group Users',
			precedence: 100,
		});
	}
}
