const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
require("dotenv").config();
const crypto = require('crypto');
const { connectToDatabase } = require("../db/dbConnector");
exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    const { email } = requestBody;
    const authHeader = event.headers.Authorization || event.headers.authorization;
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
        const client = await connectToDatabase();
        const client1 = new CognitoIdentityProviderClient({ region: "us-east-1" });
        const command = new InitiateAuthCommand(params);
        const data = await client1.send(command);

        await client.query(
            `UPDATE employee
             SET access_token = $1
             WHERE work_email = $2`,
            [data.AuthenticationResult.AccessToken, email]
        );

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ Access_token : data.AuthenticationResult.AccessToken }),
        };
    } catch (error) {
        return error.message;
    }
};

function getSecretHash(email) {
    const clientId = process.env.COGNITO_CLIENT_ID;
    const message = email + clientId;
    const secretHash = crypto.createHmac('SHA256', clientId).update(message).digest('base64');
    return secretHash;
}
