const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");
const { authorize } = require("../util/authorizer");

const DesignationSchema = z.object({
    designation: z.string().min(3, { message: "designation name must be at least 3 characters long" }),
    id: z.number().int() 
}); 

exports.handler = middy(async (event,context) => {
	context.callbackWaitsForEmptyEventLoop = false;
    const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
    const { designation, id } = JSON.parse(event.body);
    const client = await connectToDatabase();

        const result = await client.query(
            `UPDATE emp_designation SET designation = $1, org_id = $2 WHERE id = $3 RETURNING *`,
            [designation, org_id, id]
        );
        if (result.rowCount === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    message: "Designation not found",
                }),
            };
        }
        const updatedDesignation = result.rows[0];
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(updatedDesignation),
        };

})
   .use(bodyValidator(DesignationSchema))
   .use(authorize())
   .use(errorHandler());