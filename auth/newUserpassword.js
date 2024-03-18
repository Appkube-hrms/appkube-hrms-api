const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const {
	CognitoIdentityProviderClient,
	RespondToAuthChallengeCommand,
	AdminInitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider")
const bodyParser = require("body-parser")
const { bodyValidator } = require("../util/bodyValidator")

const reqSchema = z.object({
	email: z.string(),
	password: z.string(),
	newpassword: z.string(),
})

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
})

const updateInvitationStatus = `
                                UPDATE employee SET 
                                invitation_status  = $1
                                WHERE work_email = $2
                                RETURNING invitation_status ;`

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const requestBody = JSON.parse(event.body)
	const workEmail = requestBody.email
	const req = {
		email: requestBody.email,
		password: requestBody.password,
		newpassword: requestBody.newpassword,
	}

	const valResult = reqSchema.safeParse(req)
	if (!valResult.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: valResult.error.formErrors.fieldErrors,
			}),
		}
	}
	const client = await connectToDatabase()

	const inputAuth = {
		UserPoolId: process.env.COGNITO_POOL_ID,
		ClientId: process.env.COGNITO_CLIENT_ID,
		AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
		AuthParameters: {
			USERNAME: req.email,
			PASSWORD: req.password,
		},
	}
	const authResponse = await cognitoClient.send(
		new AdminInitiateAuthCommand(inputAuth),
	)
	const authChallengeInput = {
		ChallengeName: "NEW_PASSWORD_REQUIRED",
		ClientId: process.env.COGNITO_CLIENT_ID,
		ChallengeResponses: {
			USERNAME: req.email,
			NEW_PASSWORD: req.newpassword,
		},
		Session: authResponse.Session,
	}
	newPasswordResponse = await cognitoClient.send(
		new RespondToAuthChallengeCommand(authChallengeInput),
	)

	await client.query(updateInvitationStatus, ["ACTIVE", workEmail])
	return {
		statusCode: 301,
		headers: {
			"Access-Control-Allow-Origin": "*",
			Location: "https://workflow.synectiks.net/",
		},
		body: JSON.stringify({
			message: " Password-Reset Successfully ",
		}),
	}
})
	.use(bodyValidator(reqSchema))
	.use(errorHandler())
