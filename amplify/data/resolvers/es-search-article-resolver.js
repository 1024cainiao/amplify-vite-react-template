import { util } from '@aws-appsync/utils';

/**
 * Searches for documents by using an input term
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
	const must = [];
	if (ctx.args.kana) {
		must.push({ term: { kana: ctx.args.kana } });
	}
	if (ctx.args.seasonId) {
		must.push({ term: { seasonId: ctx.args.seasonId } });
	}
	if (ctx.args.categoryId) {
		must.push({ term: { categoryId: ctx.args.categoryId } });
	}
	const sort = [];
	if (ctx.args.sortKeys && ctx.args.sortKeys.length > 0 && ctx.args.sortType && ctx.args.sortType.length > 0) {
		for (let i = 0; i < ctx.args.sortKeys.length; i++) {
			const item = {};
			item[ctx.args.sortKeys[i]] = ctx.args.sortType[i];
			sort.push(item);
		}
	}
	return {
		operation: 'GET',
		path: '/article/_search',
		params: {
			body: {
				from: ctx.args.from,
				size: ctx.args.size,
				query: {
					bool: {
						must: must,
					},
				},
				sort: sort,
			},
		},
	};
}

/**
 * Returns the fetched items
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
	if (ctx.error) {
		util.error(ctx.error.message, ctx.error.type);
	}
	const list = ctx.result.hits.hits.map((hit) => hit._source);
	const total = ctx.result.hits.total.value;
	const result = { list, total };
	return JSON.stringify(result);
}
