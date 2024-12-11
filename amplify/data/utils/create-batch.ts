import { a } from '@aws-amplify/backend';
import { USER_POOL_GROUP_ADMINS } from '../../constant';

export const createBatchDelTable = (link: string) => {
	return a
		.mutation()
		.arguments({ table: a.string().required(), ids: a.string().array() })
		.returns(a.boolean())
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS)])
		.handler(
			a.handler.custom({
				dataSource: a.ref(link),
				entry: '../resolvers/batch-del-table.js',
			})
		);
};

export const createBatchPutTable = (link: string) => {
	return a
		.mutation()
		.arguments({ table: a.string().required(), body: a.string().required() })
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS)])
		.returns(a.json())
		.handler(
			a.handler.custom({
				dataSource: a.ref(link),
				entry: '../resolvers/batch-put-table.js',
			})
		);
};
