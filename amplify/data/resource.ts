import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { USER_POOL_GROUP_ADMINS } from '../constant';
import { createBatchDelTable, createBatchPutTable } from './utils/create-batch';

const masterType = {
	id: a.id().required(),
	name: a.string().required(),
	type: a.string().required(),
	sort: a.integer().required(),
};

const schema = a.schema({
	Todo: a
		.model({
			name: a.string(),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])]),
	Network: a
		.model({
			...masterType,
			articles: a.hasMany('Article', 'networkId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('networkListByTypeAndId')]),
	delNetwork: createBatchDelTable('Network'),
	putNetwork: createBatchPutTable('Network'),
	Category: a
		.model({
			...masterType,
			articles: a.hasMany('Article', 'categoryId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('categoryListByTypeAndId')]),
	delCategory: createBatchDelTable('Category'),
	putCategory: createBatchPutTable('Category'),
	Season: a
		.model({
			...masterType,
			articles: a.hasMany('Article', 'seasonId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('seasonListByTypeAndId')]),
	delSeason: createBatchDelTable('Season'),
	putSeason: createBatchPutTable('Season'),
	Person: a
		.model({
			...masterType,
			articleCasts: a.hasMany('ArticleCast', 'personId'),
			articleAuthors: a.hasMany('ArticleAuthor', 'personId'),
			articleDirectors: a.hasMany('ArticleDirector', 'personId'),
			articleProducers: a.hasMany('ArticleProducer', 'personId'),
			articleScreenwriters: a.hasMany('ArticleScreenwriter', 'personId'),
			articleOriginalWorks: a.hasMany('ArticleOriginalWork', 'personId'),
			image: a.string(),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('personListByTypeAndId')]),
	delPerson: createBatchDelTable('Person'),
	putPerson: createBatchPutTable('Person'),
	ArticleVod: a
		.model({
			articleId: a.id().required(),
			vodId: a.id().required(),
			vod: a.belongsTo('Vod', 'vodId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'vodId']),
	delArticleVod: createBatchDelTable('ArticleVod'),
	putArticleVod: createBatchPutTable('ArticleVod'),
	Vod: a
		.model({
			...masterType,
			articles: a.hasMany('ArticleVod', 'vodId'),
			microcopy: a.string(),
			url: a.string(),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('vodListByTypeAndId')]),
	delVod: createBatchDelTable('Vod'),
	putVod: createBatchPutTable('Vod'),
	ArticleCast: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			roleName: a.string().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleCast: createBatchDelTable('ArticleCast'),
	putArticleCast: createBatchPutTable('ArticleCast'),
	ArticleAuthor: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleAuthor: createBatchDelTable('ArticleAuthor'),
	putArticleAuthor: createBatchPutTable('ArticleAuthor'),
	ArticleDirector: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleDirector: createBatchDelTable('ArticleDirector'),
	putArticleDirector: createBatchPutTable('ArticleDirector'),
	ArticleProducer: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleProducer: createBatchDelTable('ArticleProducer'),
	putArticleProducer: createBatchPutTable('ArticleProducer'),
	ArticleScreenwriter: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleScreenwriter: createBatchDelTable('ArticleScreenwriter'),
	putArticleScreenwriter: createBatchPutTable('ArticleScreenwriter'),
	ArticleOriginalWork: a
		.model({
			articleId: a.id().required(),
			personId: a.id().required(),
			person: a.belongsTo('Person', 'personId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'personId']),
	delArticleOriginalWork: createBatchDelTable('ArticleOriginalWork'),
	putArticleOriginalWork: createBatchPutTable('ArticleOriginalWork'),
	ArticleMusic: a
		.model({
			type: a.string().required(),
			articleId: a.id().required(),
			article: a.belongsTo('Article', 'articleId'),
			course: a.integer().required(),
			opArtist: a.string(),
			opSong: a.string(),
			edArtist: a.string(),
			edSong: a.string(),
			otherArtist: a.string(),
			otherSon: a.string(),
			sort: a.integer().required(), // articleId
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'course'])
		.secondaryIndexes((index) => [
			index('type').sortKeys(['sort', 'course']).queryField('musicListByTypeAndSortCourse'),
		]),
	delArticleMusic: createBatchDelTable('ArticleMusic'),
	putArticleMusic: createBatchPutTable('ArticleMusic'),
	PageSetting: a
		.model({
			articleId: a.id().required(),
			type: a.string().required(), // eg: anime-CAROUSEL / anime-SPOTLIGHT
			article: a.belongsTo('Article', 'articleId'),
			sort: a.integer().required(),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'type'])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('settingListByTypeAndSort')]),
	delPageSetting: createBatchDelTable('PageSetting'),
	putPageSetting: createBatchPutTable('PageSetting'),
	Article: a
		.model({
			id: a.id().required(),
			genreType: a.enum(['movie', 'drama', 'variety', 'anime']),
			tagType: a.enum(['root', 'series', 'episode']),
			pathName: a.string().required(), // eg: spy_family | spy_family/season1 | spy_family/season1/episode1
			parentId: a.id(),
			childs: a.hasMany('Article', 'parentId'),
			parent: a.belongsTo('Article', 'parentId'),
			pageSetting: a.hasMany('PageSetting', 'articleId'),
			kana: a.string().required(),
			title: a.string().required(),
			titleMeta: a.string(),
			descriptionMeta: a.string(),
			networkId: a.id().required(),
			network: a.belongsTo('Network', 'networkId'),
			seasonId: a.id(),
			season: a.belongsTo('Season', 'seasonId'),
			thumbnail: a.customType({
				url: a.string(),
				text: a.string(),
				link: a.string().array(),
			}),
			vods: a.hasMany('ArticleVod', 'articleId'),
			categoryId: a.id().required(),
			category: a.belongsTo('Category', 'categoryId'),
			summary: a.customType({
				title: a.string(),
				text: a.string(),
				reference: a.string(),
				link: a.string().array(),
			}),
			authors: a.hasMany('ArticleAuthor', 'articleId'),
			authorOrganiation: a.string(),
			directors: a.hasMany('ArticleDirector', 'articleId'),
			producers: a.hasMany('ArticleProducer', 'articleId'),
			screenwriters: a.hasMany('ArticleScreenwriter', 'articleId'),
			staff: a.string(),
			productions: a.hasMany('ArticleProduction', 'articleId'),
			otherProduction: a.string(),
			casts: a.hasMany('ArticleCast', 'articleId'),
			sns: a.url().array(),
			durationTime: a.string(),
			seriesNumber: a.string(),
			publisher: a.string(),
			otherPublisher: a.string(),
			website: a.url(),
			articleOriginalWorks: a.hasMany('ArticleOriginalWork', 'articleId'),
			originalWorkOrganization: a.string(),
			label: a.string(),
			durationPeriod: a.string(),
			volume: a.string(),
			content: a.customType({
				genre: a.string(),
				subgenre: a.string(),
			}),
			distributor: a.string(),
			distributorOverseas: a.string(),
			copyright: a.string(),
			productionYear: a.string(),
			musics: a.hasMany('ArticleMusic', 'articleId'),
			video: a.customType({
				text: a.string(),
				url: a.url(),
			}),
			articleStatistics: a.hasMany('ArticleStatistic', 'articleId'),
			news: a.hasMany('NewsArticle', 'articleId'),
			sort: a.integer().required(),
		})
		.secondaryIndexes((index) => [
			index('genreType').sortKeys(['sort']).queryField('listByGenreTypeAndSort'),
			index('parentId').sortKeys(['sort']).queryField('listByParentIdAndSort'),
			index('seasonId').sortKeys(['genreType', 'tagType', 'sort']).queryField('listBySeasonIdAndTypeSort'),
			index('categoryId').sortKeys(['genreType', 'tagType', 'sort']).queryField('listByCategoryIdAndTypeSort'),
			index('pathName').queryField('listByPathName'),
			index('tagType').sortKeys(['pathName', 'sort']).queryField('listByTagTypeAndPathNameAndSort'),
		])
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])]),
	delArticle: createBatchDelTable('Article'),
	putArticle: createBatchPutTable('Article'),
	News: a
		.model({
			title: a.string().required(),
			type: a.string().required(),
			datetime: a.datetime().required(),
			endDateTime: a.datetime().required(),
			genreType: a.string().required(),
			genreTypeCopy: a.string().required(),
			isTop: a.integer().required(),
			outline: a.string().required(),
			isPublic: a.integer().required(),
			topPublic: a.string().required(),
			genreTypePublic: a.string().required(),
			titleMeta: a.string().required(),
			descriptionMeta: a.string().required(),
			content: a.string().required(),
			image: a.string().required(),
			pathName: a.string().required(),
			articles: a.hasMany('NewsArticle', 'newsId'),
			author: a.customType({
				name: a.string(),
				image: a.string(),
				description: a.string(),
			}),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [
			index('genreTypePublic').sortKeys(['datetime']).queryField('listByGenreTypePublic'),
			index('genreType').sortKeys(['datetime']).queryField('listByGenreType'),
			index('genreTypeCopy').sortKeys(['title', 'datetime']).queryField('listByGenreTypeTitle'),
			index('topPublic').sortKeys(['datetime']).queryField('listByTopAndTopPublic'),
			index('pathName').queryField('newListByPathName'),
		]),
	NewsArticle: a
		.model({
			newsId: a.id().required(),
			articleId: a.id().required(),
			news: a.belongsTo('News', 'newsId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])]),
	delNewsArticle: createBatchDelTable('NewsArticle'),
	putNewsArticle: createBatchPutTable('NewsArticle'),
	ArticleStatistic: a
		.model({
			articleId: a.id().required(),
			yearWeek: a.integer().required(), // 年-周
			// genreType: a.enum(['movie', 'drama', 'variety', 'anime']),
			// tagType: a.enum(['root', 'series', 'episode']),
			// parentArticleId: a.string(), // parentId
			clickCount: a.integer().required(), // 点击量
			parentArticleIdYearWeek: a.string().required(),
			genreTypeYearWeekTagType: a.string().required(),
			yearWeekTagType: a.string().required(),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.guest()])
		.identifier(['articleId', 'yearWeek'])
		.secondaryIndexes((index) => [
			index('parentArticleIdYearWeek')
				.sortKeys(['clickCount'])
				.queryField('listByParentArticleIdAndYearWeekAndClickCount'),
			index('genreTypeYearWeekTagType')
				.sortKeys(['clickCount'])
				.queryField('listByGenreTypeAndYearWeekAndTagTypeAndClickCount'),
			index('yearWeekTagType').sortKeys(['clickCount']).queryField('listByYearWeekAndTagTypeAndClickCount'),
		]),
	Production: a
		.model({
			...masterType,
			articleProductions: a.hasMany('ArticleProduction', 'productionId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.secondaryIndexes((index) => [index('type').sortKeys(['sort']).queryField('productionListByTypeAndId')]),
	delProduction: createBatchDelTable('Production'),
	putProduction: createBatchPutTable('Production'),
	ArticleProduction: a
		.model({
			articleId: a.id().required(),
			productionId: a.id().required(),
			production: a.belongsTo('Production', 'productionId'),
			article: a.belongsTo('Article', 'articleId'),
		})
		.authorization((allow) => [allow.group(USER_POOL_GROUP_ADMINS), allow.guest().to(['read'])])
		.identifier(['articleId', 'productionId']),
	delArticleProduction: createBatchDelTable('ArticleProduction'),
	putArticleProduction: createBatchPutTable('ArticleProduction'),

	// esSearchNews: a
	// 	.query()
	// 	.arguments({
	// 		from: a.integer().required(),
	// 		size: a.integer().required(),
	// 		isTop: a.integer(),
	// 		isPublic: a.integer(),
	// 		now: a.string(),
	// 		pathName: a.string(),
	// 		genreType: a.string(),
	// 		title: a.string(),
	// 	})
	// 	.returns(a.string())
	// 	.authorization((allow) => [allow.publicApiKey()])
	// 	.handler(
	// 		a.handler.custom({
	// 			entry: './resolvers/es-search-news-resolver.js',
	// 			dataSource: 'esDataSource1-test',
	// 		})
	// 	),

	// esSearchArticle: a
	// 	.query()
	// 	.arguments({
	// 		from: a.integer().required(),
	// 		size: a.integer().required(),
	// 		kana: a.string(),
	// 		seasonId: a.string(),
	// 		categoryId: a.string(),
	// 		sortKeys: a.string().array(),
	// 		sortType: a.string().array(),
	// 	})
	// 	.returns(a.string())
	// 	.authorization((allow) => [allow.publicApiKey()])
	// 	.handler(
	// 		a.handler.custom({
	// 			entry: './resolvers/es-search-article-resolver.js',
	// 			dataSource: 'esDataSource1-test',
	// 		})
	// 	),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'apiKey',
		// API Key is used for a.allow.public() rules
		apiKeyAuthorizationMode: {
			expiresInDays: 30,
		},
	},
});
