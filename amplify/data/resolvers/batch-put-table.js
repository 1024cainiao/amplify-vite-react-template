import { util } from '@aws-appsync/utils';

/**
 * Gets items from the DynamoDB tables in batches with the provided `id`` keys
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {import('@aws-appsync/utils').DynamoDBBatchPutItemRequest} the request
 */
export function request(ctx) {
	return {
		operation: 'BatchPutItem',
		tables: {
			[`${ctx.args.table}`]: JSON.parse(ctx.args.body).map((item) =>
				util.dynamodb.toMapValues({
					...item,
					createdAt: util.time.nowISO8601(),
					updatedAt: util.time.nowISO8601(),
				})
			),
		},
	};
}

/**
 * Returns the BatchPutItem table results
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns boolean
 */
export function response(ctx) {
	if (ctx.error) {
		util.error(ctx.error.message, ctx.error.type);
	}
	return true;
}
