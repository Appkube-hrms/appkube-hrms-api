const { connectToDatabase } = require("../db/dbConnector")
const middy = require("middy")
const jwt = require('jsonwebtoken');
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const tokenWithBearer = event.headers.Authorization
    const token = tokenWithBearer.split(' ')[1];
    const decodedToken = jwt.decode(token, { complete: true });
    const org_id = decodedToken.payload['custom:org_id'];
	const empId = event.pathParameters.emp_id
	const client = await connectToDatabase()

	const deleteQuery = `
            DELETE FROM employee
            WHERE id = $1 AND org_id = $2;
        `
	const data = await client.query(deleteQuery, [empId,org_id])
	if (data.rowCount === 0) {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "content not available" }),
		}
	}
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify({ message: "resource deleted successfully" }),
	}
})
	.use(authorize())
	.use(errorHandler())
