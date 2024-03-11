const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";

const handler = async (event) => {
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
	console.info("greater than zero :", JSON.stringify(result.rows));
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result.rows),
	};
};

// const handler = middy(letDesignations)
                // .use(errorHandler());

module.exports = { handler}