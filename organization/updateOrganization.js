const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");

exports.handler = async (event,context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	const requestBody = JSON.parse(event.body);
	const organisationSchema = z.object({
		name: z
			.string({
				message: "company name should be atleast 3 character long",
			})
			.min(3),
		email: z.string().email({ message: "Invalid email address" }),
		number: z
			.string({
				message:
					"Invalid phone number format. Should be a valid phone number format",
			})
			.regex(
				/^(\+\d{1,2}\s?)?(\(\d{3}\)\s?\d{3}(-|\s?)\d{4}|\d{10}(-|\s?)\d{4}|\d{7,11})$/
			),
		logo: z.string().default(""),
		address_line_1: z.string(),
		address_line_2: z.string(),
		landmark: z.string().optional(),
		country: z.string(),
		state: z.string({
			message: "State is required",
		}),
		city: z.string(),
		zipcode: z.string().regex(/^\d{6}$/),
		orgId: z.string().uuid({
			message: "invalid request",
		}),
	});
	const validReq = organisationSchema.safeParse(requestBody);
	console.log(JSON.stringify(requestBody));
	if (!validReq.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: validReq.error.formErrors.fieldErrors,
			}),
		};
	}
	const client = await connectToDatabase();
	try {
		const res = await client.query(
			` UPDATE organisation 
            SET 
               name = $1, 
               email = $2, 
               number = $3, 
               logo = $4, 
               address_line_1 = $5, 
               address_line_2 = $6, 
               landmark = $7, 
               country = $8, 
               state = $9, 
               city = $10,
               zipcode = $11 
            WHERE id = $12
            RETURNING *
            `,
			[
				requestBody.name,
				requestBody.email,
				requestBody.number,
				requestBody.logo,
				requestBody.address_line_1,
				requestBody.address_line_2,
				requestBody.landmark,
				requestBody.country,
				requestBody.state,
				requestBody.city,
				requestBody.zipcode,
				requestBody.orgId,
			]
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(res.rows[0]),
		};
	} catch (e) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: e.message, error: e }),
		};
	} finally {
		await client.end();
	}
};