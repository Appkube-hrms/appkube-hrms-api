const { connectToDatabase } = require("../db/dbConnector")
const middy = require("middy")
const jwt = require('jsonwebtoken')
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")

const letDesignations = async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const tokenWithBearer = event.headers.Authorization
    const token = tokenWithBearer.split(' ')[1];
    const decodedToken = jwt.decode(token, { complete: true });
    const org_id = decodedToken.payload['custom:org_id'];
	const client = await connectToDatabase()
	const query = `
                        SELECT 
                            id, designation
                        FROM
                             emp_designation
                        WHERE
                            org_id = $1::uuid`
	const result = await client.query(query, [org_id])
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result.rows),
	}
}

const handler = middy(letDesignations).use(authorize()).use(errorHandler())

module.exports = { handler }
