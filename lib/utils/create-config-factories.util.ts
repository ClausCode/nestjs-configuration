import { registerAs } from "@nestjs/config"
import type { z } from "zod"

import { validateSchema } from "./validate-schema.util"

type AnyZodObject = z.ZodObject<z.ZodRawShape>
type Env = Record<string, string | undefined>

export function createConfigFactories<T extends AnyZodObject>(
	schema: T,
	transform: (env: Env) => z.input<T>,
) {
	const keys = Object.keys(schema.shape) as (keyof T["shape"] & string)[]

	let validated: z.output<T> | undefined

	const getValidated = (): z.output<T> => {
		if (validated === undefined) {
			validated = validateSchema(schema, transform(process.env))
		}

		return validated
	}

	return keys.map(key => registerAs(key, () => getValidated()[key]))
}
