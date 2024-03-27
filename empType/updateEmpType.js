const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")

const EmpTypeSchema = z.object({
	type: z
		.string()
		.min(3, { message: "type name must be at least 3 characters long" }),
	id: z.number().int(),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const org_id = event.requestContext.authorizer.claims['custom:org_id'];
	const { type, id } = JSON.parse(event.body)
	const client = await connectToDatabase()

	const result = await client.query(
		`UPDATE emp_type SET type = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
		[type,id,org_id],
	)
	if (result.rowCount === 0) {
		await client.end();
		return {
			statusCode: 404,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "EmpType not found",
			}),
		}
	}
	const updatedEmpType = result.rows[0]
	await client.end();
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(updatedEmpType),
	}
})
	.use(authorize())
	.use(bodyValidator(EmpTypeSchema))
	.use(errorHandler())
