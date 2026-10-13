import type { z } from "zod"

export class ConfigurationValidationError extends Error {
	public readonly issues: z.core.$ZodIssue[]

	public constructor(issues: z.core.$ZodIssue[]) {
		super(
			issues
				.map(issue => {
					const path = issue.path.map(String).join(".") || "<root>"
					return `  • ${path}: ${issue.message}`
				})
				.join("\n"),
		)

		this.name = "ConfigurationValidationError"
		this.issues = issues
	}
}

export function validateSchema<T extends z.ZodType>(
	schema: T,
	data: unknown,
): z.infer<T> {
	const result = schema.safeParse(data)

	if (!result.success) {
		throw new ConfigurationValidationError(result.error.issues)
	}

	return result.data
}
