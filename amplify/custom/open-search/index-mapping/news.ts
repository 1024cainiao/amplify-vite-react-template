import { indexTemplateType } from './index';

export const news: indexTemplateType = {
	// 别名务必小于等于2位
	alias: 'ne',
	indexName: 'news',
	indexMapping: {
		settings: {
			number_of_shards: 1,
			number_of_replicas: 0,
		},
		mappings: {
			properties: {
				id: {
					type: 'keyword',
				},
				title: {
					type: 'text',
				},
				type: {
					type: 'keyword',
				},
				datetime: {
					type: 'date',
				},
				endDateTime: {
					type: 'date',
				},
				genreType: {
					type: 'keyword',
				},
				genreTypeCopy: {
					type: 'keyword',
				},
				isTop: {
					type: 'integer',
				},
				outline: {
					type: 'keyword',
				},
				isPublic: {
					type: 'integer',
				},
				topPublic: {
					type: 'keyword',
				},
				genreTypePublic: {
					type: 'keyword',
				},
				titleMeta: {
					type: 'text',
				},
				descriptionMeta: {
					type: 'text',
				},
				content: {
					type: 'text',
				},
				image: {
					type: 'keyword',
				},
				pathName: {
					type: 'keyword',
				},
				author: {
					type: 'nested',
					properties: {
						name: {
							type: 'text',
						},
						image: {
							type: 'keyword',
						},
						description: {
							type: 'text',
						},
					},
				},
			},
		},
	},
};
