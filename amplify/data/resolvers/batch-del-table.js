import { util } from '@aws-appsync/utils';

/**
 * Deletes items from DynamoDB tables in batches with the provided `id` keys
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {import('@aws-appsync/utils').DynamoDBBatchDeleteItemRequest} the request
 */
export function request(ctx) {
	return {
		operation: 'BatchDeleteItem',
		tables: {
			[`${ctx.args.table}`]: ctx.args.ids.map((id) => util.dynamodb.toMapValues({ id })),
		},
	};
}

/**
 * Returns the BatchDeleteItem table results
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns boolean
 */
export function response(ctx) {
	if (ctx.error) {
		util.error(ctx.error.message, ctx.error.type);
	}
	return true;
}
