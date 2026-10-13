import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { createConfigFactories } from "../../lib/utils"

describe("createConfigFactories", () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should create a factory for each top-level schema key", () => {
		const schema = z.object({
			app: z.object({ name: z.string() }),
			database: z.object({ url: z.string() }),
			debug: z.boolean(),
		})

		const factories = createConfigFactories(schema, () => ({
			app: { name: "example" },
			database: { url: "postgresql://localhost/test" },
			debug: true,
		}))

		expect(factories).toHaveLength(3)
		expect(factories.map(factory => factory.KEY)).toEqual([
			"CONFIGURATION(app)",
			"CONFIGURATION(database)",
			"CONFIGURATION(debug)",
		])
	})

	it("should parse nested object sections", () => {
		const schema = z.object({
			app: z.object({
				name: z.string(),
				port: z.number().int(),
			}),
		})

		const factories = createConfigFactories(schema, () => ({
			app: { name: "example", port: 3000 },
		}))

		const appFactory = factories.find(
			factory => factory.KEY === "CONFIGURATION(app)",
		)

		expect(appFactory).toBeDefined()
		expect(appFactory?.()).toEqual({
			name: "example",
			port: 3000,
		})
	})

	it("should parse primitive top-level sections", () => {
		const schema = z.object({
			debug: z.boolean(),
		})

		const factories = createConfigFactories(schema, () => ({
			debug: true,
		}))

		const debugFactory = factories.find(
			factory => factory.KEY === "CONFIGURATION(debug)",
		)

		expect(debugFactory?.()).toBe(true)
	})

	it("should apply defaults when parsing a section", () => {
		const schema = z.object({
			app: z.object({
				name: z.string().default("test-app"),
			}),
		})

		const factories = createConfigFactories(schema, () => ({
			app: {},
		}))

		const appFactory = factories.find(
			factory => factory.KEY === "CONFIGURATION(app)",
		)

		expect(appFactory?.()).toEqual({ name: "test-app" })
	})

	it("should throw when a section is invalid", () => {
		const schema = z.object({
			app: z.object({
				port: z.number().positive(),
			}),
		})

		const factories = createConfigFactories(schema, () => ({
			app: { port: -1 },
		}))

		const appFactory = factories.find(
			factory => factory.KEY === "CONFIGURATION(app)",
		)

		expect(() => appFactory?.()).toThrow()
	})

	it("should transform the environment only once when factories share a cache", () => {
		const transform = vi.fn(() => ({
			app: { name: "example" },
			debug: true,
		}))

		const schema = z.object({
			app: z.object({ name: z.string() }),
			debug: z.boolean(),
		})

		const factories = createConfigFactories(schema, transform)

		for (const factory of factories) {
			factory()
		}

		expect(transform).toHaveBeenCalledTimes(1)
	})
})
