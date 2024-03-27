const { connectToDatabase } = require("../db/dbConnector")
const middy = require("middy")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
    const org_id = event.requestContext.authorizer.claims['custom:org_id'];
	const client = await connectToDatabase()
	const query = `
                        SELECT 
                            id, name
                        FROM
                             department
                        WHERE
                            org_id = $1::uuid`
	const result = await client.query(query, [org_id])
	if (result.rowCount > 0) {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(result.rows),
		}
	} else {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify([]),
		}
	}
})
	.use(authorize())
	.use(errorHandler())
