const { connectToDatabase } = require("../db/dbConnector");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");

exports.handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    let page = event.queryStringParameters?.page ?? null;
    if (page == null) {
        page = 1;
    }
    page = parseInt(page);
    const limit = 10;
    let offset = (page - 1) * 10;
    offset = Math.max(offset, 0);
    const client = await connectToDatabase();
    const totalPagesQuery = `
                SELECT COUNT(*) AS total_count
                FROM employee e
                LEFT JOIN emp_detail ed2 ON e.emp_detail_id = ed2.id
                LEFT JOIN emp_designation ed ON ed2.designation_id = ed.id
                LEFT JOIN emp_type et ON ed2.emp_type_id = et.id
                LEFT JOIN department d ON ed2.department_id = d.id
    `;
    const query = `
                SELECT
                    e.id,
                    e.first_name,
                    e.last_name,
                    e.work_email,
                    ed.designation,
                    ed2.employee_id,
                    et.type AS emp_type,
                    d.name AS department,
                    ed2.start_date
                FROM
                    employee e
                LEFT JOIN emp_detail ed2 ON e.emp_detail_id = ed2.id
                LEFT JOIN emp_designation ed ON ed2.designation_id = ed.id
                LEFT JOIN emp_type et ON ed2.emp_type_id = et.id
                LEFT JOIN department d ON ed2.department_id = d.id
                ORDER BY e.first_name 
                LIMIT 10 OFFSET ${offset}
    `;
    const totalPagesResult = await client.query(totalPagesQuery);
    const totalRecords = totalPagesResult.rows[0].total_count;
    const totalPages = Math.ceil(totalRecords / limit);
    const employeeMetaData = await client.query(query);
    const resultArray = employeeMetaData.rows.map((row) => ({
        employee_name: `${row.first_name} ${row.last_name}`,
        id: row.id,
        email: row.work_email,
        designation: row.designation,
        employee_type: row.emp_type,
        department: row.department,
        start_date: row.start_date,
    }));
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            totalPages: totalPages,
            currentPage: page,
            employees: resultArray,
        }),
    };
})  
    .use(errorHandler())
    .use(authorize());
