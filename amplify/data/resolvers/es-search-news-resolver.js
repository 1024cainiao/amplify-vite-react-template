import { util } from '@aws-appsync/utils';

/**
 * Searches for documents by using an input term
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
	const must = [];
	if (ctx.args.isTop) {
		must.push({ term: { isTop: ctx.args.isTop } });
	}
	if (ctx.args.isPublic) {
		must.push({ term: { isPublic: ctx.args.isPublic } });
	}
	if (ctx.args.now) {
		must.push({ range: { endDateTime: { gte: ctx.args.now } } });
		must.push({ range: { datetime: { lte: ctx.args.now } } });
	}
	if (ctx.args.pathName) {
		must.push({ term: { pathName: ctx.args.pathName } });
	}
	if (ctx.args.genreType) {
		must.push({ term: { genreType: ctx.args.genreType } });
	}
	if (ctx.args.title) {
		must.push({ term: { title: ctx.args.title } });
	}

	return {
		operation: 'GET',
		path: '/news/_search',
		params: {
			body: {
				from: ctx.args.from,
				size: ctx.args.size,
				query: {
					bool: {
						must: must,
					},
				},
				sort: [{ datetime: 'desc' }],
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
