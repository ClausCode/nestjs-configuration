import { registerAs } from "@nestjs/config"
import { z } from "zod"

type AnyZodObject = z.ZodObject<z.ZodRawShape>
type Env = Record<string, string | undefined>

export function createConfigFactories<T extends AnyZodObject>(
	schema: T,
	transform: (env: Env) => z.input<T>,
) {
	const keys = Object.keys(schema.shape) as (keyof T["shape"] & string)[]

	let transformed: z.input<T> | undefined

	const getTransformed = (): z.input<T> => {
		if (transformed === undefined) {
			transformed = transform(process.env)
		}

		return transformed
	}

	return keys.map(key => {
		const sectionSchema = schema.shape[key]

		return registerAs(key, () => {
			const config = getTransformed() as Record<string, unknown>
			return z.parse(sectionSchema, config[key])
		})
	})
}
