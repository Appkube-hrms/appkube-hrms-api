const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

const org_id = "146f03b7-3c87-40b3-87bf-080739dfabee";

exports.handler = middy(async (event) => {
	console.info("info :", org_id);
	const client = await connectToDatabase();
	console.info("connected to database :", JSON.stringify(client));
	const query = `
                        SELECT 
                            id, designation
                        FROM
                             emp_designation
                        WHERE
                            org_id = $1::uuid`;
	const result = await client.query(query, [org_id]);
	console.info("query result :", JSON.stringify(result.rows));
	console.info("greater than zero :", JSON.stringify(result.rows));
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result.rows),
	};
}).use(errorHandler());
