import { indexTemplateType } from './index';

export const article: indexTemplateType = {
	// 别名务必小于等于2位
	alias: 'ar',
	indexName: 'article',
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
				genreType: {
					type: 'keyword',
				},
				tagType: {
					type: 'keyword',
				},
				pathName: {
					type: 'keyword',
				},
				parentId: {
					type: 'keyword',
				},
				kana: {
					type: 'text',
				},
				title: {
					type: 'text',
				},
				titleMeta: {
					type: 'text',
				},
				descriptionMeta: {
					type: 'keyword',
				},
				networkId: {
					type: 'keyword',
				},
				seasonId: {
					type: 'keyword',
				},
				thumbnail: {
					properties: {
						url: {
							type: 'keyword',
						},
						text: {
							type: 'text',
						},
						link: {
							type: 'keyword',
						},
					},
				},
				categoryId: {
					type: 'keyword',
				},
				summary: {
					properties: {
						title: {
							type: 'text',
						},
						text: {
							type: 'text',
						},
						reference: {
							type: 'keyword',
						},
						link: {
							type: 'keyword',
						},
					},
				},
				authorOrganiation: {
					type: 'text',
				},
				staff: {
					type: 'text',
				},
				otherProduction: {
					type: 'text',
				},
				sns: {
					type: 'keyword',
				},
				durationTime: {
					type: 'keyword',
				},
				seriesNumber: {
					type: 'keyword',
				},
				publisher: {
					type: 'keyword',
				},
				otherPublisher: {
					type: 'keyword',
				},
				website: {
					type: 'keyword',
				},
				originalWorkOrganization: {
					type: 'keyword',
				},
				label: {
					type: 'text',
				},
				durationPeriod: {
					type: 'text',
				},
				volume: {
					type: 'keyword',
				},
				content: {
					properties: {
						genre: {
							type: 'keyword',
						},
						subgenre: {
							type: 'keyword',
						},
					},
				},
				distributor: {
					type: 'keyword',
				},
				distributorOverseas: {
					type: 'keyword',
				},
				copyright: {
					type: 'keyword',
				},
				productionYear: {
					type: 'keyword',
				},
				video: {
					properties: {
						text: {
							type: 'text',
						},
						url: {
							type: 'keyword',
						},
					},
				},
				sort: {
					type: 'integer',
				},
			},
		},
	},
};
