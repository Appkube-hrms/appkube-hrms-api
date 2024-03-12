require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");
const jwt = require("jsonwebtoken");

const reqSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
});

exports.handler = middy(async (event,context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	const requestBody = JSON.parse(event.body);
	const req = {
		email: requestBody.email,
		password: requestBody.password,
	};

	const input = {
		ClientId: process.env.COGNITO_CLIENT_ID,
		AuthFlow: "USER_PASSWORD_AUTH",
		AuthParameters: {
			USERNAME: req.email,
			PASSWORD: req.password,
		},
	};

	const authResponse = await cognitoClient.send(
		new InitiateAuthCommand(input)
	);
	console.log(JSON.stringify(authResponse));
	const accessToken = authResponse.AuthenticationResult.IdToken;
	const refreshToken = authResponse.AuthenticationResult.RefreshToken;
	// const idToken = authResponse.AuthenticationResult.IdToken;
    const tokenDetails = jwt.decode(accessToken, { complete: true, json: true });
    const userId = tokenDetails.payload['custom:user_id'];
	const client = await connectToDatabase();
	await client.query(
		`
	            UPDATE employee
	            SET access_token = $1,
	                refresh_token = $2
	            WHERE
	                work_email = $3`,
		[accessToken, refreshToken, req.email]
	);
	const res = await client.query(
		`SELECT * FROM employee WHERE id = $1`,
		[userId]
	);
	const result = res.rows[0];
	const PersonalDetails = {
		id: result.id || "",
		email: result.email || "",
		work_email: result.work_email || "",
		first_name: result.first_name || "",
		last_name: result.last_name || "",
		gender: result.gender || "",
		dob: result.dob || "",
		number: result.number || "",
		emergency_number: result.emergency_number || "",
		highest_qualification: result.highest_qualification || "",
		emp_detail_id: result.emp_detail_id || "",
		description: result.description || "",
		current_task_id: result.current_task_id || "",
		invitation_status: result.invitation_status || "",
		org_id: result.org_id || "",
		image: result.image || "",
		email_verified: result.email_verified || "",
	};
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify({
			Result: PersonalDetails,
			AccessToken: accessToken,
			RefreshToken: refreshToken,
		}),
	};
})
	.use(bodyValidator(reqSchema))
	.use(errorHandler());
