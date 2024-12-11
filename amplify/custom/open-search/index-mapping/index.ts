import { news } from './news';
import { article } from './article';

export type indexTemplateType = {
	alias: string;
	indexName: string;
	indexMapping: {
		settings: {
			number_of_shards: number;
			number_of_replicas: number;
		};
		mappings: {
			properties: Record<string, any>;
		};
	};
};

export const indicesMap: Record<'News' | 'Article', indexTemplateType> = {
	News: news,
	Article: article,
};
