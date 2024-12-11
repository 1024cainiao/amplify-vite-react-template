import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { USER_POOL_GROUP_ADMINS, USER_POOL_GROUP_USERS } from '../../constant';

export const handler: PreTokenGenerationTriggerHandler = async (event) => {
	if (event.request.clientMetadata?.mode == USER_POOL_GROUP_ADMINS) {
		if (
			!event.request.groupConfiguration.groupsToOverride ||
			event.request.groupConfiguration.groupsToOverride.length == 0 ||
			event.request.groupConfiguration.groupsToOverride?.includes(USER_POOL_GROUP_USERS)
		) {
			throw Error('No Auth');
		}
	}
	return event;
};
