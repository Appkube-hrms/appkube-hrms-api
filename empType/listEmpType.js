const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");
const { corsMiddleware } = require("../util/corsMiddleware");

const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";

exports.handler = middy(async (event,context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	const client = await connectToDatabase();
	const query = `
                SELECT 
                    id, type
                FROM
                     emp_type
                WHERE
                    org_id = $1::uuid`;
	const result = await client.query(query, [org_id]);
	if (result.rowCount > 0) {
		return {
			statusCode: 200,
			body: JSON.stringify(result.rows),
		};
	} else {
		return {
			statusCode: 200,
			body: JSON.stringify([]),
		};
	}
})

	.use(authorize())
    .use(corsMiddleware())
	.use(errorHandler());
