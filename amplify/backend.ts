// @ts-ignore
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// @ts-ignore
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
// @ts-ignore
import * as iam from "aws-cdk-lib/aws-iam";
// @ts-ignore
import * as osis from "aws-cdk-lib/aws-osis";
// @ts-ignore
import * as logs from "aws-cdk-lib/aws-logs";
// @ts-ignore
import {RemovalPolicy, Stack} from "aws-cdk-lib";
import {defineBackend} from '@aws-amplify/backend';
import {auth} from './auth/resource';
import {data} from './data/resource';
import {storage} from "./storage/resource";
import {TodosQueriesApi} from "./custom/todos-query/resource";
import {USER_POOL_GROUP_ADMINS} from "./constant";

const backend = defineBackend({
    auth,
    data,
    storage,
});


const todoTable =
    backend.data.resources.cfnResources.amplifyDynamoDbTables['Todo'];


// Update table settings
todoTable.pointInTimeRecoveryEnabled = true;


todoTable.streamSpecification = {
    streamViewType: dynamodb.StreamViewType.NEW_IMAGE
};


const personTable =
    backend.data.resources.cfnResources.amplifyDynamoDbTables['Person']

personTable.pointInTimeRecoveryEnabled = true;

personTable.streamSpecification = {
    streamViewType: dynamodb.StreamViewType.NEW_IMAGE
};


// Get the DynamoDB table ARN
const tableArn = backend.data.resources.tables['Todo'].tableArn;
// Get the DynamoDB table name
const tableName = backend.data.resources.tables['Todo'].tableName;

const personTableArn = backend.data.resources.tables['Person'].tableArn
const personTableName = backend.data.resources.tables['Person'].tableName;

const studentTableArn = backend.data.resources.tables['Student'].tableArn;
const studentTableName = backend.data.resources.tables['Student'].tableName;

const stack = Stack.of(backend.data);

// Create the OpenSearch domain
const openSearchDomain = new opensearch.Domain(
    stack,
    'OpenSearchDomain',
    {
        version: opensearch.EngineVersion.OPENSEARCH_2_11,
        nodeToNodeEncryption: true,
        encryptionAtRest: {
            enabled: true
        },
    }
);


// Get the S3Bucket ARN
const s3BucketArn = backend.storage.resources.bucket.bucketArn;
// Get the S3Bucket Name
const s3BucketName = backend.storage.resources.bucket.bucketName;


// Create an IAM role for OpenSearch integration
const openSearchIntegrationPipelineRole = new iam.Role(
    stack,
    "OpenSearchIntegrationPipelineRole",
    {
        assumedBy: new iam.ServicePrincipal("osis-pipelines.amazonaws.com"),
        inlinePolicies: {
            openSearchPipelinePolicy: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ["es:DescribeDomain"],
                        resources: [
                            openSearchDomain.domainArn,
                            openSearchDomain.domainArn + "/*",
                        ],
                        effect: iam.Effect.ALLOW,
                    }),
                    new iam.PolicyStatement({
                        actions: ["es:ESHttp*"],
                        resources: [
                            openSearchDomain.domainArn,
                            openSearchDomain.domainArn + "/*",
                        ],
                        effect: iam.Effect.ALLOW,
                    }),
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "s3:GetObject",
                            "s3:AbortMultipartUpload",
                            "s3:PutObject",
                            "s3:PutObjectAcl",
                        ],
                        resources: [s3BucketArn, s3BucketArn + "/*"],
                    }),
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "dynamodb:DescribeTable",
                            "dynamodb:DescribeContinuousBackups",
                            "dynamodb:ExportTableToPointInTime",
                            "dynamodb:DescribeExport",
                            "dynamodb:DescribeStream",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                        ],
                        resources: [tableArn, tableArn + "/*", personTableArn, personTableArn + "/*", studentTableArn, studentTableArn+"/*"],
                    }),
                ],
            }),
        },
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "AmazonOpenSearchIngestionFullAccess"
            ),
        ],
    }
);


// Define OpenSearch index mappings
const indexName = "todo";


const indexMapping = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
    },
    mappings: {
        properties: {
            id: {
                type: "keyword",
            },
            done: {
                type: "boolean",
            },
            content: {
                type: "text",
            },
        },
    },
};

// OpenSearch template definition
const openSearchTemplate = `
version: "2"
dynamodb-pipeline:
  source:
    dynamodb:
      acknowledgments: true
      tables:
        - table_arn: "${tableArn}"
          stream:
            start_position: "LATEST"
          export:
            s3_bucket: "${s3BucketName}"
            s3_region: "${stack.region}"
            s3_prefix: "${tableName}/"
      aws:
        sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
        region: "${stack.region}"
  sink:
    - opensearch:
        hosts:
          - "https://${openSearchDomain.domainEndpoint}"
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
          sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
          region: "${stack.region}"
`;

const personIndexName = "person"

const personIndexMapping = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
    },
    mappings: {
        properties: {
            id: {
                type: "keyword",
            },
            name: {
                type: "text",
            },
            age: {
                type: "integer"
            }
        },
    },
}

const personOpenSearchTemplate = `
version: "2"
dynamodb-pipeline:
  source:
    dynamodb:
      acknowledgments: true
      tables:
        - table_arn: "${personTableArn}"
          stream:
            start_position: "LATEST"
          export:
            s3_bucket: "${s3BucketName}"
            s3_region: "${stack.region}"
            s3_prefix: "${personTableName}/"
      aws:
        sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
        region: "${stack.region}"
  sink:
    - opensearch:
        hosts:
          - "https://${openSearchDomain.domainEndpoint}"
        index: "${personIndexName}"
        index_type: "custom"
        template_content: |
          ${JSON.stringify(personIndexMapping)}
        document_id: '\${getMetadata("primary_key")}'
        action: '\${getMetadata("opensearch_action")}'
        document_version: '\${getMetadata("document_version")}'
        document_version_type: "external"
        bulk_size: 4
        aws:
          sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
          region: "${stack.region}"
`;

const studentIndexName = "student"

const studentIndexMapping = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
    },
    mappings: {
        properties: {
            id: {
                type: "keyword",
            },
            name: {
                type: "text",
            },
            age: {
                type: "integer"
            }
        },
    },
}

const studentOpenSearchTemplate = `
version: "2"
dynamodb-pipeline:
  source:
    dynamodb:
      acknowledgments: true
      tables:
        - table_arn: "${studentTableArn}"
          stream:
            start_position: "LATEST"
          export:
            s3_bucket: "${s3BucketName}"
            s3_region: "${stack.region}"
            s3_prefix: "${studentTableName}/"
      aws:
        sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
        region: "${stack.region}"
  sink:
    - opensearch:
        hosts:
          - "https://${openSearchDomain.domainEndpoint}"
        index: "${studentIndexName}"
        index_type: "custom"
        template_content: |
          ${JSON.stringify(studentIndexMapping)}
        document_id: '\${getMetadata("primary_key")}'
        action: '\${getMetadata("opensearch_action")}'
        document_version: '\${getMetadata("document_version")}'
        document_version_type: "external"
        bulk_size: 4
        aws:
          sts_role_arn: "${openSearchIntegrationPipelineRole.roleArn}"
          region: "${stack.region}"
`;


// Create a CloudWatch log group
const logGroup = new logs.LogGroup(stack, "LogGroup", {
    logGroupName: "/aws/vendedlogs/OpenSearchService/pipelines/2",
    removalPolicy: RemovalPolicy.DESTROY,
});


// Create an OpenSearch Integration Service pipeline
const cfnPipeline = new osis.CfnPipeline(
    stack,
    "OpenSearchIntegrationPipeline",
    {
        maxUnits: 4,
        minUnits: 1,
        pipelineConfigurationBody: openSearchTemplate,
        pipelineName: "dynamodb-integration-1",
        logPublishingOptions: {
            isLoggingEnabled: true,
            cloudWatchLogDestination: {
                logGroup: logGroup.logGroupName,
            },
        },
    }
);

const personCfnPipeline = new osis.CfnPipeline(
    stack,
    "PersonOpenSearchIntegrationPipeline",
    {
        maxUnits: 4,
        minUnits: 1,
        pipelineConfigurationBody: personOpenSearchTemplate,
        pipelineName: "dynamodb-integration-2",
        logPublishingOptions: {
            isLoggingEnabled: true,
            cloudWatchLogDestination: {
                logGroup: logGroup.logGroupName,
            },
        },
    }
);

const studentCfnPipeline = new osis.CfnPipeline(
    stack,
    "studentOpenSearchIntegrationPipeline",
    {
        maxUnits: 4,
        minUnits: 1,
        pipelineConfigurationBody: studentOpenSearchTemplate,
        pipelineName: "dynamodb-integration-3",
        logPublishingOptions: {
            isLoggingEnabled: true,
            cloudWatchLogDestination: {
                logGroup: logGroup.logGroupName,
            },
        },
    }
);

// Add OpenSearch data source
const osDataSource = backend.data.addOpenSearchDataSource(
    "osDataSource",
    openSearchDomain
);


// create the admin queries
const todoQueriesName = 'todoQueries';
const todoQueriesStack = backend.createStack(todoQueriesName);
const todosApi = new TodosQueriesApi(todoQueriesStack, todoQueriesName, {
    esArn: openSearchDomain.domainArn,
    userPoolClients: [backend.auth.resources.userPoolClient],
    allowGroups: [USER_POOL_GROUP_ADMINS],
});

backend.addOutput({
    custom: {
        API: {
            [todoQueriesName]: {
                endpoint: todosApi.url,
            },
        },
        es: {
            endpoint: openSearchDomain.domainEndpoint,
            arn: openSearchDomain.domainArn
        }
    }
})


