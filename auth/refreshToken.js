const AWS = require('aws-sdk');
const crypto = require('crypto');
const { connectToDatabase } = require("../db/dbConnector");
const cognitoIdentityProvider = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    const {email} = requestBody;
     const authHeader =
		event.headers.Authorization || event.headers.authorization;
        const token = authHeader.substring(7); 
        const client = await connectToDatabase();
    try {
        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: {
                'REFRESH_TOKEN': token,
                'SECRET_HASH': getSecretHash(email)
            }
        };
        const data = await cognitoIdentityProvider.initiateAuth(params).promise();
        await client.query(
            `
                    UPDATE employee
                    SET access_token = $1
                    WHERE
                        work_email = $2`,
            [data.AuthenticationResult.AccessToken,email]
        );
        return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({Access_token : data.AuthenticationResult.AccessToken}),
		};
    } catch (error) {
        return error.message;
    }
};

function getSecretHash(email) {
    const clientId = process.env.COGNITO_CLIENT_ID;
    const date = new Date().toISOString().substring(0, 10);
    const message = email + clientId;
    const secretHash = crypto.createHmac('SHA256', clientId).update(message).digest('base64');
    return secretHash;
}
