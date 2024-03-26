const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const jwt = require('jsonwebtoken')
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")

const reqSchema = z.object({
	designation: z.string().min(3, {
		message: "Designation name must be at least 3 characters long",
	}),
})

exports.handler = middy(async (event, context) => {
	const tokenWithBearer = event.headers.Authorization
    const token = tokenWithBearer.split(' ')[1];
    const decodedToken = jwt.decode(token, { complete: true });
    const org_id = decodedToken.payload['custom:org_id'];
	context.callbackWaitsForEmptyEventLoop = false
	const { designation } = JSON.parse(event.body)
	const client = await connectToDatabase()
	const result = await client.query(
		`INSERT INTO emp_designation (designation, org_id) VALUES ($1, $2) RETURNING *`,
		[designation, org_id],
	)
	const insertedDesignation = result.rows[0]
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(insertedDesignation),
	}
})
	.use(authorize())
	.use(bodyValidator(reqSchema))
	.use(errorHandler())
