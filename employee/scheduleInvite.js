const { SchedulerClient, CreateScheduleCommand } = require('@aws-sdk/client-scheduler');
const uuid = require('uuid');
require("dotenv").config();
const { z } = require("zod");
const middy = require("middy");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");

const schema = z.object({
    timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
    id: z.string().uuid(),
    invitation_status: z.string().refine(value => value === "SCHEDULED", {
        message: "invitation_status must be 'SCHEDULED'"
    })
});

exports.handler = middy(async (event, context) => {
    const scheduler = new SchedulerClient({ region: 'us-east-1' });

    const requestBody = JSON.parse(event.body);
    console.log(requestBody);
    console.log("timestamp", requestBody.timestamp);

    inputPrams = {
        timestamp: requestBody.timestamp,
        pathParameters: {
            id: requestBody.id
        },
        queryStringParameters: {
            invitation_status: requestBody.invitation_status
        }
    }

    const response = await scheduler.send(new CreateScheduleCommand({
        ActionAfterCompletion: 'DELETE',
        FlexibleTimeWindow: {
            Mode: 'OFF' // OFF | FLEXIBLE
        },
        ScheduleExpression: `at(${requestBody.timestamp})`,
        ScheduleExpressionTimezone: 'UTC+05:30',
        Target: {
            Arn: `arn:aws:lambda:us-east-1:${process.env.ACC_NO}:function:hrms-dev-inviteUser`,
            Input: JSON.stringify(inputPrams),
            RoleArn: `arn:aws:iam::${process.env.ACC_NO}:role/service-role/Amazon_EventBridge_Scheduler_LAMBDA_5d666aa429`
        },
        Name: uuid.v4()
    }));

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: `user invited scheduled successfully at ${requestBody.timestamp}` }),
    };
})
    .use(bodyValidator(schema))
    .use(errorHandler());