import { Inject, Injectable } from "@nestjs/common"
import type { Path, PathValue } from "@nestjs/config"
// biome-ignore lint/style/useImportType: <>
import { ConfigService } from "@nestjs/config"
import type { z } from "zod"

import { CONFIGURATION_OPTIONS } from "./constants"
import type { ConfigurationOptions } from "./interfaces"

@Injectable()
export class ConfigurationService<
	T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
	public constructor(
		@Inject(CONFIGURATION_OPTIONS)
		options: ConfigurationOptions<T>,
		private readonly config: ConfigService<z.output<T>>,
	) {
		this.config = config as ConfigService<z.infer<typeof options.schema>>
	}

	public get<P extends Path<z.output<T>>>(key: P): PathValue<z.output<T>, P> {
		return this.config.getOrThrow(key) as PathValue<z.output<T>, P>
	}
}
