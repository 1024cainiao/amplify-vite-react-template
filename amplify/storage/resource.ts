import { defineStorage } from '@aws-amplify/backend';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement, StarPrincipal } from 'aws-cdk-lib/aws-iam';

export const storage = defineStorage({
	name: 'atsumediaStorage',
	access: (allow) => ({
		'public/*': [allow.authenticated.to(['read', 'write', 'delete']), allow.guest.to(['read'])],
	}),
});

export const handlePublicStorage = (s3Bucket: s3.IBucket) => {
	const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;

	cfnBucket.accelerateConfiguration = {
		accelerationStatus: 'Enabled', // 'Suspended' if you want to disable transfer acceleration
	};

	cfnBucket.publicAccessBlockConfiguration = {
		blockPublicAcls: true,
		blockPublicPolicy: false,
		ignorePublicAcls: true,
		restrictPublicBuckets: false,
	};

	s3Bucket.addToResourcePolicy(
		new PolicyStatement({
			actions: ['s3:GetObject'],
			effect: Effect.ALLOW,
			principals: [new StarPrincipal()],
			resources: [s3Bucket.arnForObjects('*')],
		})
	);

	// cfnBucket.corsConfiguration = {
	// 	corsRules: [
	// 		{
	// 			allowedHeaders: ['*'],
	// 			allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
	// 			allowedOrigins: ['*'],
	// 			exposedHeaders: [''],
	// 			maxAge: 3000,
	// 		},
	// 	],
	// };
};
