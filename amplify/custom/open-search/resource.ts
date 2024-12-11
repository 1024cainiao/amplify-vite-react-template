import { Construct } from 'constructs';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { AmplifyGraphqlApi } from '@aws-amplify/graphql-api-construct';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { OpenSearchDataSource } from 'aws-cdk-lib/aws-appsync';
import * as logs from 'aws-cdk-lib/aws-logs';
import { indicesMap } from './index-mapping';
import * as osis from 'aws-cdk-lib/aws-osis';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

type OpenSearchConfigProps = {
	stack: Stack;
	data: Omit<AmplifyGraphqlApi, 'getResourceAccessAcceptor'>;
	s3Bucket: IBucket;
};

const OPEN_SEARCH_DOMAIN_ID = 'es';
// const TABLES: (keyof typeof indicesMap)[] = ['News', 'Article'];
const TABLES: (keyof typeof indicesMap)[] = ['News'];
const OPEN_SEARCH_INTEGRATION_PIPELINE_ROLE_ID = 'esIntegrationPipelineRole';
const ES_DATA_SOURCE_ID = 'esDataSource1-test';

export class OpenSearchConfig extends Construct {
	public readonly openSearchDomain: opensearch.Domain;
	public readonly pipelineRoleResource: string[];
	public readonly openSearchIntegrationPipelineRole: iam.Role;
	public readonly openSearchDataSource: OpenSearchDataSource;

	constructor(scope: Stack, id: string, props: OpenSearchConfigProps) {
		super(scope, id);

		// Create the OpenSearch domain
		this.openSearchDomain = new opensearch.Domain(props.stack, OPEN_SEARCH_DOMAIN_ID, {
			version: opensearch.EngineVersion.OPENSEARCH_2_11,
			nodeToNodeEncryption: true,
			encryptionAtRest: {
				enabled: true,
			},
		});

		this.pipelineRoleResource = TABLES.map((item) => {
			const table = props.data.resources.tables[item];
			return [table.tableArn, `${table.tableArn}/*`];
		}).flat();

		this.openSearchIntegrationPipelineRole = new iam.Role(props.stack, OPEN_SEARCH_INTEGRATION_PIPELINE_ROLE_ID, {
			assumedBy: new iam.ServicePrincipal('osis-pipelines.amazonaws.com'),
			inlinePolicies: {
				openSearchPipelinePolicy: new iam.PolicyDocument({
					statements: [
						new iam.PolicyStatement({
							actions: ['es:DescribeDomain'],
							resources: [this.openSearchDomain.domainArn, this.openSearchDomain.domainArn + '/*'],
							effect: iam.Effect.ALLOW,
						}),
						new iam.PolicyStatement({
							actions: ['es:ESHttp*'],
							resources: [this.openSearchDomain.domainArn, this.openSearchDomain.domainArn + '/*'],
							effect: iam.Effect.ALLOW,
						}),
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: ['s3:GetObject', 's3:AbortMultipartUpload', 's3:PutObject', 's3:PutObjectAcl'],
							resources: [props.s3Bucket.bucketArn, props.s3Bucket.bucketArn + '/*'],
						}),
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: [
								'dynamodb:DescribeTable',
								'dynamodb:DescribeContinuousBackups',
								'dynamodb:ExportTableToPointInTime',
								'dynamodb:DescribeExport',
								'dynamodb:DescribeStream',
								'dynamodb:GetRecords',
								'dynamodb:GetShardIterator',
							],
							// resources: [
							// 	newsTable.tableArn,
							// 	newsTable.tableArn + '/*',
							// 	articleTable.tableArn,
							// 	articleTable.tableArn + '/*',
							// ],
							resources: this.pipelineRoleResource,
						}),
					],
				}),
			},
			managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonOpenSearchIngestionFullAccess')],
		});

		// Create a CloudWatch log group
		const logGroup = new logs.LogGroup(props.stack, `LogGroup-es-1`, {
			logGroupName: `/aws/vendedlogs/OpenSearchService/pipelines/${this.openSearchDomain.domainName}`,
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// Add OpenSearch data source
		this.openSearchDataSource = props.data.addOpenSearchDataSource(ES_DATA_SOURCE_ID, this.openSearchDomain);

		for (const item of TABLES) {
			const table = props.data.resources.tables[item];
			const cfnTable = props.data.resources.cfnResources.amplifyDynamoDbTables[item];
			const indexName = indicesMap[item].indexName;
			const pipelineName = indicesMap[item].alias;
			const indexMapping = indicesMap[item].indexMapping;
			cfnTable.pointInTimeRecoveryEnabled = true;

			cfnTable.streamSpecification = {
				streamViewType: dynamodb.StreamViewType.NEW_IMAGE,
			};
			const openSearchTemplate = `
        version: "2"
        dynamodb-pipeline:
          source:
            dynamodb:
              acknowledgments: true
              tables:
                - table_arn: "${table.tableArn}"
                  stream:
                    start_position: "LATEST"
                  export:
                    s3_bucket: "${props.s3Bucket.bucketName}"
                    s3_region: "${props.stack.region}"
                    s3_prefix: "${table.tableName}/"
              aws:
                sts_role_arn: "${this.openSearchIntegrationPipelineRole.roleArn}"
                region: "${props.stack.region}"
          sink:
            - opensearch:
                hosts:
                  - "https://${this.openSearchDomain.domainEndpoint}"
                index: "${indexName}"
                index_type: "custom"
                template_content: |
                  ${JSON.stringify(indexMapping)}
                document_id: '\${getMetadata("primary_key")}'
                action: '\${getMetadata("opensearch_action")}'
                document_version: '\${getMetadata("document_version")}'
                document_version_type: "external"
                bulk_size: 4
                aws:
                  sts_role_arn: "${this.openSearchIntegrationPipelineRole.roleArn}"
                  region: "${props.stack.region}"
        `;

			// Create an OpenSearch Integration Service pipeline
			new osis.CfnPipeline(props.stack, `cfnPipeline-${item}`, {
				maxUnits: 4,
				minUnits: 1,
				pipelineConfigurationBody: openSearchTemplate,
				pipelineName: `${pipelineName}-${this.openSearchDomain.domainName}`,
				logPublishingOptions: {
					isLoggingEnabled: true,
					cloudWatchLogDestination: {
						logGroup: logGroup.logGroupName,
					},
				},
			});
		}
	}
}
