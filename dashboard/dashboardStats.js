const { connectToDatabase } = require("../db/dbConnector")
const middy = require("middy")
const jwt = require('jsonwebtoken');
const { errorHandler } = require("../util/errorHandler")
const { authorize } = require("../util/authorizer")

exports.handler = middy(async (event, context) => {
	
const tokenWithBearer = event.headers.Authorization
const token = tokenWithBearer.split(' ')[1];
const decodedToken = jwt.decode(token, { complete: true });
const org_id = decodedToken.payload['custom:org_id'];
	const client = await connectToDatabase()

	const countQuery = `
        SELECT
            (
                SELECT COUNT(id) FROM employee WHERE org_id = $1
            ) AS employee_count,
            (
                SELECT COUNT(id) FROM projects_table WHERE org_id = $2
            ) AS project_count;
        `
	const countResult = await client.query(countQuery,[org_id,org_id])
	const employeeCount = countResult.rows[0].employee_count
	const projectCount = countResult.rows[0].project_count

	await client.end()

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify({
			Totalemployees: employeeCount,
			Totalprojects: projectCount,
		}),
	}
})
	.use(authorize())
	.use(errorHandler())
