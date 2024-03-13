const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");

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
                },
                body: JSON.stringify({ message: "content not available" }),
            };
        }
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({message: "resource deleted successfully"})
        };
})  
    .use(errorHandler())
    .use(authorize());