import type { Provider } from "@nestjs/common"

import { CONFIGURATION_OPTIONS } from "./constants"
import type {
	ConfigurationAsyncOptions,
	ConfigurationOptions,
} from "./interfaces"

export function createConfigurationOptionsProvider(
	options: ConfigurationOptions,
): Provider {
	return {
		provide: CONFIGURATION_OPTIONS,
		useValue: Object.freeze({ ...options }),
	}
}

export function createConfigurationAsyncOptionsProvider(
	options: ConfigurationAsyncOptions,
): Provider {
	return {
		provide: CONFIGURATION_OPTIONS,
		useFactory: async (...args: unknown[]) => {
			const resolved = await options.useFactory(...args)

			if (!resolved) {
				throw new Error('[ConfigurationModule] "schema" is required')
			}

			return Object.freeze({ ...resolved })
		},
		inject: options.inject ?? [],
	}
}
