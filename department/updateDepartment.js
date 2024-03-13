const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");
const { authorize } = require("../util/authorizer");

const DepartmentSchema = z.object({
    name: z.string().min(3, { message: "Department name must be at least 3 characters long" }),
    id: z.number().int() 
}); 

exports.handler = middy(async (event,context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
    const { name, id } = JSON.parse(event.body);
    const client = await connectToDatabase();

        const result = await client.query(
            `UPDATE department SET name = $1, org_id = $2 WHERE id = $3 RETURNING *`,
            [name, org_id, id]
        );
        if (result.rowCount === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    message: "Department not found",
                }),
            };
        }
        const updatedDepartment = result.rows[0];
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(updatedDepartment),
        };

})
   .use(bodyValidator(DepartmentSchema))
   .use(authorize())
   .use(errorHandler());