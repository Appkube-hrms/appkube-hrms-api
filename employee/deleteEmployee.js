const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

exports.handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const empId = event.pathParameters.emp_id;
    const client = await connectToDatabase();

        const deleteQuery = `
            DELETE FROM employee
            WHERE id = $1;
        `;
        const data = await client.query(deleteQuery, [empId]);
        if (data.rowCount === 0) {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({ message: "contend not available" }),
            };
        }
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({message: "resource deleted successfully"})
        };
}).use(errorHandler());