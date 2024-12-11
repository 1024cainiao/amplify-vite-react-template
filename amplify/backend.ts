import {defineBackend} from '@aws-amplify/backend';
import {auth} from './auth/resource.js';
import {data} from './data/resource.js';
import {UserPool} from 'aws-cdk-lib/aws-cognito';
import {UserPollGroup} from './custom/user-pool-group/resource';
import {AuthTrigger} from './custom/auth-trigger/resource';
import {Stack} from 'aws-cdk-lib';
import {PolicyStatement, Role} from 'aws-cdk-lib/aws-iam';
import {handlePublicStorage, storage} from './storage/resource';
import {OpenSearchConfig} from './custom/open-search/resource';

const backend = defineBackend({
	auth,
	data,
	storage,
});

const stack = Stack.of(backend.data);

const ddbTable = backend.data.resources.tables['Todo'];
backend.addOutput({
	custom: {
		Table: Object.entries(backend.data.resources.tables)
			.map(([key, value]) => ({ [key]: value.tableName }))
			.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
	},
});
const ddbDataSourceRoleArn = backend.data.resources.cfnResources.cfnDataSources['TodoTable'].serviceRoleArn;
if (ddbDataSourceRoleArn) {
	const ddbDataSourceRole = Role.fromRoleArn(stack, 'DynamoDBServiceRoleArn', ddbDataSourceRoleArn);
	ddbDataSourceRole.addToPrincipalPolicy(
		new PolicyStatement({
			actions: ['dynamodb:BatchWriteItem'],
			resources: [ddbTable.tableArn],
		})
	);
}

const s3Bucket = backend.storage.resources.bucket;

handlePublicStorage(s3Bucket);

const userPool = backend.auth.resources.userPool as UserPool;

// create auth trigger stack
const authTriggerName = 'AuthTriggerStack';
const authTriggerStack = backend.createStack(authTriggerName);
new AuthTrigger(authTriggerStack, authTriggerName, { userPool: userPool });

// create groups stack
const authGroupsName = 'AuthGroupsStack';
const groupsStack = backend.createStack(authGroupsName);
new UserPollGroup(groupsStack, authGroupsName, {
	userPool: userPool,
	identityPoolId: backend.auth.resources.cfnResources.cfnIdentityPool.ref,
});

// create the bucket and its stack
// const publicBucketName = 'PublicBucketStack';
// const bucketStack = backend.createStack(publicBucketName);
// new PublicBucket(bucketStack, publicBucketName, {
// 	resources: backend.auth.resources,
// });

// create the admin queries
// const adminQueriesName = 'AdminQueries-test';
// const adminQueriesStack = backend.createStack(adminQueriesName);
// const adminApi = new AdminQueriesApi(adminQueriesStack, adminQueriesName, {
// 	userPool,
// 	userPoolClients: [backend.auth.resources.userPoolClient],
// 	allowGroups: [USER_POOL_GROUP_ADMINS],
// });

const openSearchName = 'openSearch-test';
const openSearchStack = backend.createStack(openSearchName);
const openSearchConfig = new OpenSearchConfig(openSearchStack, openSearchName, {
	stack,
	data: backend.data,
	s3Bucket: s3Bucket,
});

// const OPEN_SEARCH_DOMAIN_ID = 'es';
// // Create the OpenSearch domain
// const openSearchDomain = new opensearch.Domain(stack, OPEN_SEARCH_DOMAIN_ID, {
// 	version: opensearch.EngineVersion.OPENSEARCH_2_11,
// 	nodeToNodeEncryption: true,
// 	encryptionAtRest: {
// 		enabled: true,
// 	},
// });
//
// const newsTable = backend.data.resources.tables['News'];
// const newsCfnTable = backend.data.resources.cfnResources.amplifyDynamoDbTables['News'];
// const newsIndexName = indicesMap['News'].indexName;
// const newsPipelineName = indicesMap['News'].alias;
// const newsIndexMapping = indicesMap['News'].indexMapping;
// newsCfnTable.pointInTimeRecoveryEnabled = true;
//
// newsCfnTable.streamSpecification = {
// 	streamViewType: dynamodb.StreamViewType.NEW_IMAGE,
// };
//
// const articleTable = backend.data.resources.tables['Article'];
// const articleCfnTable = backend.data.resources.cfnResources.amplifyDynamoDbTables['Article'];
// const articleIndexName = indicesMap['Article'].indexName;
// const articlePipelineName = indicesMap['Article'].alias;
// const articleIndexMapping = indicesMap['Article'].indexMapping;
// articleCfnTable.pointInTimeRecoveryEnabled = true;
//
// articleCfnTable.streamSpecification = {
// 	streamViewType: dynamodb.StreamViewType.NEW_IMAGE,
// };
//
// const OPEN_SEARCH_INTEGRATION_PIPELINE_ROLE_ID = 'esIntegrationPipelineRole';
// const openSearchIntegrationPipelineRole = new iam.Role(stack, OPEN_SEARCH_INTEGRATION_PIPELINE_ROLE_ID, {
// 	assumedBy: new iam.ServicePrincipal('osis-pipelines.amazonaws.com'),
// 	inlinePolicies: {
// 		openSearchPipelinePolicy: new iam.PolicyDocument({
// 			statements: [
// 				new iam.PolicyStatement({
// 					actions: ['es:DescribeDomain'],
// 					resources: [openSearchDomain.domainArn, openSearchDomain.domainArn + '/*'],
// 					effect: iam.Effect.ALLOW,
// 				}),
// 				new iam.PolicyStatement({
// 					actions: ['es:ESHttp*'],
// 					resources: [openSearchDomain.domainArn, openSearchDomain.domainArn + '/*'],
// 					effect: iam.Effect.ALLOW,
// 				}),
// 				new iam.PolicyStatement({
// 					effect: iam.Effect.ALLOW,
// 					actions: ['s3:GetObject', 's3:AbortMultipartUpload', 's3:PutObject', 's3:PutObjectAcl'],
// 					resources: [s3Bucket.bucketArn, s3Bucket.bucketArn + '/*'],
// 				}),
// 				new iam.PolicyStatement({
// 					effect: iam.Effect.ALLOW,
// 					actions: [
// 						'dynamodb:DescribeTable',
// 						'dynamodb:DescribeContinuousBackups',
// 						'dynamodb:ExportTableToPointInTime',
// 						'dynamodb:DescribeExport',
// 						'dynamodb:DescribeStream',
// 						'dynamodb:GetRecords',
// 						'dynamodb:GetShardIterator',
// 					],
// 					resources: [
// 						newsTable.tableArn,
// 						newsTable.tableArn + '/*',
// 						articleTable.tableArn,
// 						articleTable.tableArn + '/*',
// 					],
// 				}),
// 			],
// 		}),
// 	},
// 	managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonOpenSearchIngestionFullAccess')],
// });
//
// const LOG_GROUP_ID = 'LogGroup-es';
// // Create a CloudWatch log group
// const logGroup = new logs.LogGroup(stack, LOG_GROUP_ID, {
// 	logGroupName: `/aws/vendedlogs/OpenSearchService/pipelines/${openSearchDomain.domainName}`,
// 	removalPolicy: RemovalPolicy.DESTROY,
// });
//
// const newsOpenSearchTemplate = `
// version: "2"
// dynamodb-pipeline:
//   source:
//     dynamodb:
//       acknowledgments: true
//       tables:
//         - table_arn: "${newsTable.tableArn}"
//           stream:
//             start_position: "LATEST"
//           export:
//             s3_bucket: "${s3Bucket.bucketName}"
//             s3_region: "${stack.region}"
//             s3_prefix: "${newsTable.tableName}/"
//       aws:
//         sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
//         region: "${stack.region}"
//   sink:
//     - opensearch:
//         hosts:
//           - "https://${openSearchDomain.domainEndpoint}"
//         index: "${newsIndexName}"
//         index_type: "custom"
//         template_content: |
//           ${JSON.stringify(newsIndexMapping)}
//         document_id: '\${getMetadata("primary_key")}'
//         action: '\${getMetadata("opensearch_action")}'
//         document_version: '\${getMetadata("document_version")}'
//         document_version_type: "external"
//         bulk_size: 4
//         aws:
//           sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
//           region: "${stack.region}"
// `;
//
// // Create an OpenSearch Integration Service pipeline
// new osis.CfnPipeline(stack, `cfnPipeline-News`, {
// 	maxUnits: 4,
// 	minUnits: 1,
// 	pipelineConfigurationBody: newsOpenSearchTemplate,
// 	pipelineName: `${newsPipelineName}-${openSearchDomain.domainName}`,
// 	logPublishingOptions: {
// 		isLoggingEnabled: true,
// 		cloudWatchLogDestination: {
// 			logGroup: logGroup.logGroupName,
// 		},
// 	},
// });
//
// const articleOpenSearchTemplate = `
// version: "2"
// dynamodb-pipeline:
//   source:
//     dynamodb:
//       acknowledgments: true
//       tables:
//         - table_arn: "${articleTable.tableArn}"
//           stream:
//             start_position: "LATEST"
//           export:
//             s3_bucket: "${s3Bucket.bucketName}"
//             s3_region: "${stack.region}"
//             s3_prefix: "${articleTable.tableName}/"
//       aws:
//         sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
//         region: "${stack.region}"
//   sink:
//     - opensearch:
//         hosts:
//           - "https://${openSearchDomain.domainEndpoint}"
//         index: "${articleIndexName}"
//         index_type: "custom"
//         template_content: |
//           ${JSON.stringify(articleIndexMapping)}
//         document_id: '\${getMetadata("primary_key")}'
//         action: '\${getMetadata("opensearch_action")}'
//         document_version: '\${getMetadata("document_version")}'
//         document_version_type: "external"
//         bulk_size: 4
//         aws:
//           sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
//           region: "${stack.region}"
// `;
//
// // Create an OpenSearch Integration Service pipeline
// new osis.CfnPipeline(stack, `cfnPipeline-Article`, {
// 	maxUnits: 4,
// 	minUnits: 1,
// 	pipelineConfigurationBody: articleOpenSearchTemplate,
// 	pipelineName: `${articlePipelineName}-${openSearchDomain.domainName}`,
// 	logPublishingOptions: {
// 		isLoggingEnabled: true,
// 		cloudWatchLogDestination: {
// 			logGroup: logGroup.logGroupName,
// 		},
// 	},
// });
//
// const ES_DATA_SOURCE_ID = 'esDataSource1';
// const openSearchDataSource = backend.data.addOpenSearchDataSource(ES_DATA_SOURCE_ID, openSearchDomain);

backend.addOutput({
	custom: {
		S3: {
			endpoint: s3Bucket.bucketRegionalDomainName,
		},
		es: {
			domainArn: openSearchConfig.openSearchDomain.domainArn,
			domainId: openSearchConfig.openSearchDomain.domainId,
			domainName: openSearchConfig.openSearchDomain.domainName,
			stackId: openSearchConfig.openSearchDomain.stack.stackId,
			stackName: openSearchConfig.openSearchDomain.stack.stackName,
		},
	},
});
