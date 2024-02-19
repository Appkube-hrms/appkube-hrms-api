const { connectToDatabase } = require("../db/dbConnector");

exports.handler = async (event) => {
	const equipmentDetails = JSON.parse(event.body);
	const org_id = "482d8374-fca3-43ff-a638-02c8a425c492";
	const currentTimestamp = new Date().toISOString();
	const addEquipmentQuery = {
                name: "add-equipment",
        		text: `
                        INSERT INTO equipment 
                            (owner, device_type_id, manufacturer, serial_number, note, supply_date, emp_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                        `,
	};
	const client = await connectToDatabase();
	await client.query("BEGIN");
	try {
        const insertedEquipment = []
		for (const equipment of equipmentDetails) {
            const empProfessionalQueryResult = await client.query(
                addEquipmentQuery,
                [
                    equipment.owner,
                    equipment.device_type_id,
                    equipment.manufacturer,
                    equipment.serial_number,
                    equipment.note,
                    equipment.supply_date,
                    equipment.emp_id,
                ]
            );
             insertedEquipment.push (empProfessionalQueryResult.rows[0]);
        }``
		// const data = {
		// 	professionalInfo: {
		// 		...empProfessionalQueryResult.rows[0],
		// 		emp_id: undefined,
		// 	},
		// };
		await client.query("COMMIT");
		return {
			statuscode: 200,
			headers: {
				Access_Control_Allow_Origin: "*",
			},
			body: JSON.stringify(
				insertedEquipment),
		};
	} catch (error) {
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	} finally {
		await client.end();
	}
};
