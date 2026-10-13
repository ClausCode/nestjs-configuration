import { type DynamicModule, Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import {
	createConfigurationAsyncOptionsProvider,
	createConfigurationOptionsProvider,
} from "./configuration.provider"
import { ConfigurationService } from "./configuration.service"
import { CONFIGURATION_OPTIONS } from "./constants"
import type {
	ConfigurationAsyncOptions,
	ConfigurationOptions,
} from "./interfaces"
import { createConfigFactories } from "./utils"

@Global()
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS dynamic module requires a class
export class ConfigurationModule {
	public static register(options: ConfigurationOptions): DynamicModule {
		const optionsProvider = createConfigurationOptionsProvider(options)

		const configs = createConfigFactories(options.schema, env =>
			options.transform(env),
		)

		return {
			module: ConfigurationModule,
			imports: [
				ConfigModule.forRoot({
					...options.configOptions,
					load: configs,
				}),
			],
			providers: [optionsProvider, ConfigurationService],
			exports: [ConfigurationService, CONFIGURATION_OPTIONS],
		}
	}

	public static registerAsync(
		options: ConfigurationAsyncOptions,
	): DynamicModule {
		const optionsProvider = createConfigurationAsyncOptionsProvider(options)

		return {
			module: ConfigurationModule,
			imports: options.imports ?? [],
			providers: [optionsProvider, ConfigurationService],
			exports: [ConfigurationService, CONFIGURATION_OPTIONS],
		}
	}
}
