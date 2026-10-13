import type { ConfigModuleOptions } from "@nestjs/config"
import type { z } from "zod"

export type RawEnvironment = Record<string, string | undefined>

type AllowUndefined<T> = T extends readonly (infer U)[]
	? Array<AllowUndefined<U>> | undefined
	: T extends object
		? { [K in keyof T]: AllowUndefined<T[K]> }
		: T | undefined

export interface ConfigurationOptions<
	T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
	schema: T
	transform: (env: RawEnvironment) => AllowUndefined<z.input<T>>
	configOptions?: ConfigModuleOptions
}
