import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { AdminAddUserToGroupCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { USER_POOL_GROUP_USERS } from '../../constant';

export const handler: PostConfirmationTriggerHandler = async (event) => {
	const client = new CognitoIdentityProviderClient();
	try {
		const { userName, userPoolId } = event;
		// 将用户添加到用户组
		await addUserToGroup(client, userPoolId, userName, USER_POOL_GROUP_USERS);
		console.log(`User ${userName} added to Users group.`);
	} catch (error) {
		console.error('Error adding user to group:', error);
	}

	return event;
};

// 将用户添加到用户组
const addUserToGroup = async (
	client: CognitoIdentityProviderClient,
	userPoolId: string,
	username: string,
	groupName: string
) => {
	try {
		const command = new AdminAddUserToGroupCommand({
			UserPoolId: userPoolId,
			Username: username,
			GroupName: groupName,
		});
		const response = await client.send(command);
		console.log('User added to group successfully:', response);
		return response;
	} catch (error) {
		console.error('Error adding user to group:', error);
		throw error;
	}
};
