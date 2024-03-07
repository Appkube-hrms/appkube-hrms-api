require("dotenv").config();
const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const {
	CognitoIdentityProviderClient,
	AdminCreateUserCommand,
	AdminAddUserToGroupCommand,
	AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const generatePassword = require("generate-password");

const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid employee id" }),
});

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
});

const empDetailsQuery = `SELECT work_email, org_id 
                        FROM employee 
                        WHERE id = $1;`;

const updateInvitationStatus = `
                        UPDATE employee SET 
                        invitation_status  = $1
                        WHERE id = $2
                        RETURNING invitation_status ;`;

exports.handler = middy(async (event) => {
	const employeeId = event.pathParameters?.id ?? null;
	const client = await connectToDatabase();
	const empDetailsResult = await client.query(empDetailsQuery, [employeeId]);
	const org_id = empDetailsResult.rows[0].org_id;
	const work_email = empDetailsResult.rows[0].work_email;
	const password = generatePassword.generate({
		length: 16,
		numbers: true,
		uppercase: true,
		symbols: true,
		lowercase: true,
		excludeSimilarCharacters: true,
	});
	const input = {
		UserPoolId: process.env.COGNITO_POOL_ID,
		Username: work_email,
		TemporaryPassword: password,
		UserAttributes: [
			{
				Name: "custom:org_id",
				Value: org_id,
			},
			{
				Name: "custom:user_id",
				Value: employeeId,
			},
			{
				Name: "custom:role",
				Value: "user",
			}
		],
		DesiredDeliveryMediums: ["EMAIL"]
	};
	try {
        const command = new AdminCreateUserCommand(input)
		const res = await cognitoClient.send(command);
        console.log("After AdminCreateUserCommand");
		const addUserToGroupParams = {
			GroupName: "User",
			Username: work_email,
			UserPoolId: process.env.COGNITO_POOL_ID,
		};
		console.log("2");
		await cognitoClient.send(
			new AdminAddUserToGroupCommand(addUserToGroupParams)
		);
		await client.query(updateInvitationStatus, ["SENT", employeeId]);
		console.log("3");
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ message: "user invited successfully" }),
		};
	} catch (error) {
        console.log(error);
		const params = {
			UserPoolId: process.env.COGNITO_POOL_ID,
			Username: work_email,
		};
		console.log("4");
		await cognitoClient.send(new AdminDeleteUserCommand(params));
		console.log("5");
		throw error;
	}
})
	.use(pathParamsValidator(idSchema))
	.use(errorHandler());
