// import { SchedulerClient, DeleteScheduleCommand } from "@aws-sdk/client-scheduler"; // ES Modules import
const {
	SchedulerClient,
	DeleteScheduleCommand,
} = require("@aws-sdk/client-scheduler") // CommonJS import
const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const { errorHandler } = require("../util/errorHandler")
const { queryParamsValidator } = require("../util/queryParamsValidator")

const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid employee id" }),
})

const getScheduler = `select scheduler from invite where employee_id = $1;`
const updateInvitationStatus = `
                        UPDATE employee SET 
                        invitation_status  = $1
                        WHERE id = $2
                        RETURNING invitation_status;`

exports.handler = middy(async (event, context) => {
	const scheduler = new SchedulerClient({ region: "us-east-1" })

	const employeeId = event.queryStringParameters?.id ?? null

	const client = await connectToDatabase()

	const getSchedulerResponce = await client.query(getScheduler, [employeeId])

	const SchedulerName = getSchedulerResponce.rows[0].scheduler

	const input = {
		// DeleteScheduleInput
		Name: SchedulerName, // required
	}

	const response = await scheduler.send(new DeleteScheduleCommand(input))
	console.log("responce", response)

	if (response.$metadata.httpStatusCode === 200) {
		console.log("client connnected")
		await client.query(updateInvitationStatus, ["DRAFT", employeeId])
		console.log("query executed")
	}

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify({ message: `user invite deleted successfully.` }),
	}
})
	.use(queryParamsValidator(idSchema))
	.use(errorHandler())
