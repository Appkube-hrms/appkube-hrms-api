const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

exports.handler = middy(async (event) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const empId = event.pathParameters.emp_id;
    const client = await connectToDatabase();

        const updateQuery = `
           DELETE FROM employee WHERE emp_id = $1;
        `;
        await client.query(updateQuery, [empId]);
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify()
        };
}).use(errorHandler());

