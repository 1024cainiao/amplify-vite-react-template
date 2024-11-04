import {util} from "@aws-appsync/utils";

/**
 * Searches for documents by using an input term
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    return {
        operation: "GET",
        path: "/todo/_search",
        params: {
            body: {
                from: ctx.args.from,
                size: ctx.args.size,
                query: {
                    bool: {
                        must: [
                            {
                                term: {content: ctx.args.content}
                            },
                            {
                                term: {done: ctx.args.done}
                            }
                        ]
                    }
                },
            }
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
    const total = ctx.result.hits.total;
    const result = {list, total}
    return JSON.stringify(result);
}