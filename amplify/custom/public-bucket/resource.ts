import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { PROJECT_NAME, S3_BUCKET_NAME_PREFIX } from '../../constant';
import { Stack } from 'aws-cdk-lib/core';
import { AuthResources } from '@aws-amplify/plugin-types';

type PublicBucketPros = {
	resources: AuthResources;
};

export class PublicBucket extends Construct {
	constructor(scope: Stack, id: string, props: PublicBucketPros) {
		super(scope, id);
		const bucket = new s3.Bucket(scope, `${PROJECT_NAME}Bucket`, {
			bucketName: `${PROJECT_NAME}-${S3_BUCKET_NAME_PREFIX}-${scope.account}-${scope.region}`,
			blockPublicAccess: {
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false,
			},
			accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
			publicReadAccess: true,
			cors: [
				{
					allowedMethods: [
						s3.HttpMethods.GET,
						s3.HttpMethods.POST,
						s3.HttpMethods.PUT,
						s3.HttpMethods.DELETE,
						s3.HttpMethods.HEAD,
					],
					allowedOrigins: ['*'],
					allowedHeaders: ['*'],
				},
			],
		});

		bucket.grantReadWrite(props.resources.authenticatedUserIamRole);
		bucket.grantRead(props.resources.unauthenticatedUserIamRole);
	}
}
