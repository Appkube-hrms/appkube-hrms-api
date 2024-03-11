const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");

exports.handler = middy(async (event) => {
    const empId = event.pathParameters.id;
    const client = await connectToDatabase();

        const updateQuery = `
            UPDATE emp_detail
            SET designation_id = null, emp_type_id = null
            WHERE emp_id = $1;
        `;
        await client.query(updateQuery, [empId]);
        
        const updateMetadocs = `
        DELETE FROM metadocs_table WHERE created_by = $1
        `;
        await client.query(updateMetadocs, [empId]);
        
        const equipment = `
        DELETE FROM equipment WHERE emp_id = $1
        `;
        await client.query(equipment, [empId]);

        const deleteEmpDetail = `
            DELETE FROM emp_detail
            WHERE emp_id = $1;
        `;
         await client.query(deleteEmpDetail, [empId]);

        const deleteEmpAddress = `
            DELETE FROM address
            WHERE emp_id = $1;
        `;
        await client.query(deleteEmpAddress, [empId]);

        const deleteEmployee = `
            DELETE FROM employee 
            WHERE id = $1;
        `;
        await client.query(deleteEmployee, [empId]);
        // await client.query('COMMIT');
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify()
        };
}).use(errorHandler());

