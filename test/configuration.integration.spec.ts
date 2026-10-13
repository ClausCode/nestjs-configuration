import { Test, type TestingModule } from "@nestjs/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { z } from "zod"

import { ConfigurationModule } from "../lib/configuration.module"
import { ConfigurationService } from "../lib/configuration.service"
import { ConfigurationValidationError } from "../lib/utils"

const testSchema = z.object({
	app: z.object({
		name: z.string().default("test-app"),
		port: z.coerce.number().int().positive().default(3000),
	}),
	database: z.object({
		url: z.url(),
	}),
	debug: z.stringbool().default(false),
})

const testOptions = {
	schema: testSchema,
	transform: (env: Record<string, string | undefined>) => ({
		app: {
			name: env.APP_NAME,
			port: env.APP_PORT,
		},
		database: {
			url: env.DATABASE_URL,
		},
		debug: env.DEBUG,
	}),
}

const ENV_KEYS = ["APP_NAME", "APP_PORT", "DATABASE_URL", "DEBUG"] as const

const originalEnv = new Map(ENV_KEYS.map(key => [key, process.env[key]]))

async function createTestModule(): Promise<TestingModule> {
	return Test.createTestingModule({
		imports: [ConfigurationModule.register(testOptions)],
	}).compile()
}

function setValidEnv(): void {
	process.env.APP_NAME = "integration-test"
	process.env.APP_PORT = "3001"
	process.env.DATABASE_URL = "postgresql://localhost:5432/test"
	process.env.DEBUG = "false"
}

function clearTestEnv(): void {
	for (const key of ENV_KEYS) {
		delete process.env[key]
	}
}

describe("ConfigurationModule", () => {
	let moduleRef: TestingModule | undefined

	beforeEach(() => {
		clearTestEnv()
	})

	afterEach(async () => {
		await moduleRef?.close()
		moduleRef = undefined

		for (const key of ENV_KEYS) {
			const value = originalEnv.get(key)

			if (value === undefined) {
				delete process.env[key]
			} else {
				process.env[key] = value
			}
		}
	})

	it("should load valid configuration", async () => {
		setValidEnv()

		moduleRef = await createTestModule()
		await moduleRef.init()

		const config = moduleRef.get(ConfigurationService)

		expect(config.get("app.name")).toBe("integration-test")
		expect(config.get("app.port")).toBe(3001)
		expect(config.get("database.url")).toBe("postgresql://localhost:5432/test")
		expect(config.get("debug")).toBe(false)
	})

	it("should support default values", async () => {
		process.env.DATABASE_URL = "postgresql://localhost:5432/test"

		moduleRef = await createTestModule()
		await moduleRef.init()

		const config = moduleRef.get(ConfigurationService)

		expect(config.get("app.name")).toBe("test-app")
		expect(config.get("app.port")).toBe(3000)
		expect(config.get("debug")).toBe(false)
	})

	it("should transform environment values to correct types", async () => {
		process.env.APP_PORT = "4321"
		process.env.DATABASE_URL = "postgresql://localhost:5432/test"
		process.env.DEBUG = "true"

		moduleRef = await createTestModule()
		await moduleRef.init()

		const config = moduleRef.get(ConfigurationService)

		expect(config.get("app.port")).toBe(4321)
		expect(config.get("debug")).toBe(true)
	})

	it("should support nested configuration paths", async () => {
		setValidEnv()

		moduleRef = await createTestModule()
		await moduleRef.init()

		const config = moduleRef.get(ConfigurationService)

		expect(config.get("app.name")).toBe("integration-test")
		expect(config.get("database.url")).toBe("postgresql://localhost:5432/test")
	})

	it("should reject an invalid port", async () => {
		process.env.APP_PORT = "-1"
		process.env.DATABASE_URL = "postgresql://localhost:5432/test"

		await expect(createTestModule()).rejects.toThrow()
	})

	it("should reject a non-numeric port", async () => {
		process.env.APP_PORT = "not-a-number"
		process.env.DATABASE_URL = "postgresql://localhost:5432/test"

		await expect(createTestModule()).rejects.toThrow()
	})

	it("should reject an invalid database URL", async () => {
		process.env.DATABASE_URL = "not-a-url"

		await expect(createTestModule()).rejects.toThrow(
			ConfigurationValidationError,
		)
	})

	it("should reject a missing required database URL", async () => {
		delete process.env.DATABASE_URL

		await expect(createTestModule()).rejects.toThrow()
	})

	it("should parse false as boolean false", async () => {
		process.env.DATABASE_URL = "postgresql://localhost:5432/test"
		process.env.DEBUG = "false"

		moduleRef = await createTestModule()
		await moduleRef.init()

		const config = moduleRef.get(ConfigurationService)

		expect(config.get("debug")).toBe(false)
	})
})
