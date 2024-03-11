const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

const org_id = '482d8374-fca3-43ff-a638-02c8a425c492';

exports.handler = middy(async () => {
    console.log("log :",org_id)
    console.info("info :",org_id)
    console.warn("warn :",org_id)
    console.error("error :",org_id)
    const client = await connectToDatabase();
    const query = `
                        SELECT 
                            id, designation
                        FROM
                             emp_designation
                        WHERE
                            org_id = $1::uuid`;
    const result = await client.query(query, [org_id]);
    if (result.rowCount > 0) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(result.rows),
        };
    } else {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify([]),
        };
    }
})
    .use(errorHandler());
