import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * When used alongside data, it is automatically configured as an auth provider for data
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
	loginWith: {
		email: true,
	},
	userAttributes: {
		/** request additional attributes for your app's users */
		// profilePicture: {
		//   mutable: true,
		//   required: false,
		// },
	},
});
