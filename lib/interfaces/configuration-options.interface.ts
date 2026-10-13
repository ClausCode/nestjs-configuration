import type { ConfigModuleOptions } from "@nestjs/config"
import type { z } from "zod"

export interface ConfigurationOptions<
	T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
	schema: T
	transform: (env: Record<string, string | undefined>) => z.input<T>
	configOptions?: ConfigModuleOptions
}
