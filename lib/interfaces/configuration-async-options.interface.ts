import type { FactoryProvider, ModuleMetadata } from "@nestjs/common"

import type { ConfigurationOptions } from "./configuration-options.interface"

export interface ConfigurationAsyncOptions
	extends Pick<ModuleMetadata, "imports"> {
	useFactory: (
		...args: unknown[]
	) => Promise<ConfigurationOptions> | ConfigurationOptions
	inject?: FactoryProvider["inject"]
}
