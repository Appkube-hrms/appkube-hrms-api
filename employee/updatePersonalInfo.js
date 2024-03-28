const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("@middy/core")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")
const { pathParamsValidator } = require("../util/pathParamsValidator")

const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid employee id" }),
})

const requestBodySchema = z.object({
	first_name: z
		.string()
		.min(3, { message: "first_name must be at least 3 characters long" }),
	last_name: z
		.string()
		.min(3, { message: "last_name must be at least 3 characters long" }),
	email: z.string().email().optional(),
	work_email: z.string().email().optional(),
	gender: z.string().min(1),
	dob: z.coerce.date(),
	number: z.string(),
	emergency_number: z.string().optional(),
	highest_qualification: z.string().optional(),
	address_line_1: z.string().optional(),
	address_line_2: z.string().optional(),
	landmark: z.string().optional(),
	country: z.string().optional(),
	state: z.string().optional(),
	city: z.string().optional(),
	zipcode: z.string().optional(),
	emp_type: z.number().int().optional(),
	image: z.string().optional().default(""),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const requestBody = JSON.parse(event.body)
	requestBody.id = event.pathParameters.id
	const org_id = "482d8374-fca3-43ff-a638-02c8a425c492"
	const currentTimestamp = new Date().toISOString()
	const personalInfoQuery = `
        UPDATE employee SET
            first_name = $1,
            last_name = $2,
            email = $3,
            work_email= $4,
            gender = $5,
            dob = $6,
            number = $7,
            emergency_number = $8,
            highest_qualification = $9,
            image = $10,
            updated_at = $11
        WHERE id = $12 RETURNING *
        `

	const addressQuery = `
        UPDATE address SET
            address_line_1 = $1,
            address_line_2 = $2,
            landmark = $3,
            country= $4,
            state = $5,
            city = $6,
            zipcode = $7
        WHERE emp_id = $8 RETURNING *
        `
	const client = await connectToDatabase()
	await client.query("BEGIN")
	try {
		const personalInfoQueryResult = await client.query(personalInfoQuery, [
			requestBody.first_name,
			requestBody.last_name,
			requestBody.email,
			requestBody.work_email,
			requestBody.gender,
			requestBody.dob,
			requestBody.number,
			requestBody.emergency_number,
			requestBody.highest_qualification,
			requestBody.image,
			currentTimestamp,
			requestBody.id,
		])

		const addressQueryResult = await client.query(addressQuery, [
			requestBody.address_line_1,
			requestBody.address_line_2,
			requestBody.landmark,
			requestBody.country,
			requestBody.state,
			requestBody.city,
			requestBody.zipcode,
			requestBody.id,
		])
		await client.query("COMMIT")
		const res = {}
		Object.keys(requestBody).forEach(key => {
			res[key] = requestBody[key]
		})
		return {
			statuscode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(res),
		}
	} catch (error) {
		await client.query("ROLLBACK")
		throw error
	} finally {
		await client.end()
	}
})
	.use(authorize())
	.use(pathParamsValidator(idSchema))
	.use(bodyValidator(requestBodySchema))
	.use(errorHandler())
