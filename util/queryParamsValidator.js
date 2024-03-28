exports.queryParamsValidator = schema => ({
	before: (handler) => {
		const { queryStringParameters } = handler.event
		if (!queryStringParameters) {
			throw new Error("query parameters are missing!")
		}
		const result = schema.safeParse(queryStringParameters)
		if (!result.success) {
			next(new Error("Invalid query parameters"))
		}
	},
})
