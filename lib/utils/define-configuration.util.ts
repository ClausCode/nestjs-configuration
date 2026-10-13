import type z from "zod"

import type { ConfigurationOptions } from "../interfaces"

export function defineConfiguration<
	T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
>(options: ConfigurationOptions<T>): ConfigurationOptions<T> {
	return options
}
