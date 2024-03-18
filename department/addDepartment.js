const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")

const org_id = "482d8374-fca3-43ff-a638-02c8a425c492"

const reqSchema = z.object({
	name: z.string().min(3, {
		message: "Department name must be at least 3 characters long",
	}),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const { name } = JSON.parse(event.body)
	const client = await connectToDatabase()
	const result = await client.query(
		`INSERT INTO department (name, org_id) VALUES ($1, $2) RETURNING *`,
		[name, org_id],
	)
	const insertedDepartment = result.rows[0]
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(insertedDepartment),
	}
})
	.use(authorize())
	.use(bodyValidator(reqSchema))
	.use(errorHandler())
