const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";

const letDesignations = async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	const client = await connectToDatabase();
	const query = `
                        SELECT 
                            id, designation
                        FROM
                             emp_designation
                        WHERE
                            org_id = $1::uuid`;
	const result = await client.query(query, [org_id]);
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result.rows),
	};
};

const handler = middy(letDesignations).use(errorHandler());

module.exports = { handler };
