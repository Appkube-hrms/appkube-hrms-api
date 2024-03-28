const { connectToDatabase } = require("../../db/dbConnector")
const { z } = require("zod")
const middy = require("@middy/core")
const { authorize } = require("../../util/authorizer")
const { errorHandler } = require("../../util/errorHandler")
const { bodyValidator } = require("../../util/bodyValidator")

const requestBodySchema = z.object({
	emp_id: z.string().uuid({
		message: "invalid employee id",
	}),
	documents: z.array(
		z.object({
			name: z.string(),
			url: z.string().url(),
		}),
	),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const requestBody = JSON.parse(event.body)

	const addDocumentQuery = {
		name: "add-document",
		text: `
            INSERT INTO document
                (name, url, emp_id)
             VALUES
                ($1, $2, $3) 
            RETURNING *
        `,
	}

	const client = await connectToDatabase()

	await client.query("BEGIN")

	try {
		const insertedDocument = []
		for (const document of requestBody.documents) {
			const addDocumentQueryResult = await client.query(
				addDocumentQuery,
				[document.name, document.url, requestBody.emp_id],
			)
			const { emp_id, ...insertedDataWithoutEmpId } =
				addDocumentQueryResult.rows[0]
			insertedDocument.push(insertedDataWithoutEmpId)
		}
		await client.query("COMMIT")
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify(insertedDocument),
		}
	} catch (error) {
		await client.query("ROLLBACK")
		throw error // Throw the error to trigger error handling middleware
	} finally {
		await client.end()
	}
})
	.use(authorize())
	.use(bodyValidator(requestBodySchema))
	.use(errorHandler())
