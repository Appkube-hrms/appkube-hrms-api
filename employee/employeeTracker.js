const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
    let page = event.queryStringParameters?.page ?? null
    if (page == null){
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
    `;
    const query = `
                SELECT
                    e.id,
                    e.first_name,
                    e.last_name,
                    e.work_email,
                    e.invitation_status,
                    e.image,
                    ed.designation,
                    ed2.employee_id,
                    et.type AS emp_type
                FROM
                    employee e
                LEFT JOIN emp_detail ed2 ON e.emp_detail_id = ed2.id
                LEFT JOIN emp_designation ed ON ed2.designation_id = ed.id
                LEFT JOIN emp_type et ON ed2.emp_type_id = et.id
                LEFT JOIN department d ON ed2.department_id = d.id
                ORDER BY e.first_name 
                LIMIT 10 OFFSET ${offset}
        `;
    try {
        const totalPagesResult = await client.query(totalPagesQuery)
        const totalRecords = totalPagesResult.rows[0].total_count;
        const totalPages = Math.ceil(totalRecords / limit);
        const EmployeeMetaData = await client.query(query);
        const resultArray = EmployeeMetaData.rows.map(row => ({
            employee_name: `${row.first_name} ${row.last_name}`,
            employee_id: row.id,
            email: row.work_email,
            employee_status: row.invitation_status,
            designation: row.designation,
            employee_type: row.emp_type,
            image: row.image || ""
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                totalPages: totalPages,
                currentPage: page,
                employees: resultArray
            })
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: e.message,
                error: e
            }),
        };
    } finally {
        await client.end();
    }
};