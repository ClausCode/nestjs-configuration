# @clauscode/nestjs-configuration

**Type-safe, schema-validated configuration for NestJS, powered by Zod.**

Validate environment variables at startup, transform raw strings into correctly typed values, and access your configuration with full TypeScript autocomplete.

[![npm version](https://img.shields.io/npm/v/%40clauscode%2Fnestjs-configuration)](https://www.npmjs.com/package/@clauscode/nestjs-configuration)
[![npm downloads](https://img.shields.io/npm/dm/%40clauscode%2Fnestjs-configuration)](https://www.npmjs.com/package/@clauscode/nestjs-configuration)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

## ✨ Features

- **Schema-first configuration** — define your configuration with [Zod](https://zod.dev/).
- **Type-safe access** — get autocomplete and type checking for configuration paths.
- **Startup validation** — detect invalid configuration before your application starts serving requests.
- **Automatic type conversion** — transform environment variables into numbers, booleans, and other expected types.
- **Default values** — provide sensible defaults directly in your schema.
- **Nested configuration** — organize settings into logical sections.
- **NestJS integration** — build on top of `@nestjs/config` and the NestJS dependency injection system.

## 📦 Installation

```bash
npm install @clauscode/nestjs-configuration
```

The package requires NestJS, `@nestjs/config`, and Zod. Compatible peer dependencies may be installed automatically by npm. If your project does not already have them, install the required packages explicitly:

```bash
npm install @nestjs/common @nestjs/core @nestjs/config zod
```

## 🚀 Quick start

### 1. Define your configuration

Create a configuration file, for example `app.configuration.ts`:

```ts
import { defineConfiguration } from "@clauscode/nestjs-configuration"
import { z } from "zod"

export const schema = z.object({
  app: z.object({
    name: z.string().default("my-app"),
    port: z.coerce.number().int().positive().default(3000),
  }),

  database: z.object({
    url: z.url(),
  }),

  debug: z.stringbool().default(false),
})

export const appConfiguration = defineConfiguration({
  schema,

  transform: env => ({
    app: {
      name: env.APP_NAME,
      port: env.APP_PORT,
    },

    database: {
      url: env.DATABASE_URL,
    },

    debug: env.DEBUG,
  }),
})
```

The `schema` defines the expected configuration structure and validation rules. The `transform` function maps environment variables to the corresponding fields.

Exporting `schema` separately also lets you reuse its inferred types throughout your application without defining a separate TypeScript interface.

For example, your environment might contain:

```dotenv
APP_NAME=my-api
APP_PORT=4000
DATABASE_URL=postgresql://localhost:5432/mydb
DEBUG=false
```

Zod validates the transformed values and applies defaults when values are missing.

> **Tip:** Use `z.stringbool()` for boolean environment variables. Environment variables are strings, so `Boolean("false")` would unexpectedly return `true`.

### 2. Register the configuration module

Register your configuration in your application's root module:

```ts
import { ConfigurationModule } from "@clauscode/nestjs-configuration"
import { Module } from "@nestjs/common"

import { appConfiguration } from "./app.configuration"

@Module({
  imports: [ConfigurationModule.register(appConfiguration)],
})
export class AppModule {}
```

### 3. Use your configuration

Choose one of the following approaches to get TypeScript autocomplete and type checking.

#### Option 1: Use `typeof schema`

Pass the schema type when retrieving `ConfigurationService`:

```ts
import { ConfigurationService } from "@clauscode/nestjs-configuration"
import { NestFactory } from "@nestjs/core"

import { AppModule } from "./app.module"
import { schema } from "./app.configuration"

const app = await NestFactory.create(AppModule)

const config = app.get<ConfigurationService<typeof schema>>(
  ConfigurationService,
)

config.get("app.name")     // string
config.get("app.port")     // number
config.get("database.url") // string

config.get("database.unknown") // TypeScript error
```

TypeScript infers the configuration types directly from your Zod schema. No separate interfaces or manually declared property types are needed.

#### Option 2: Create a typed service once

If you don't want to specify `typeof schema` every time, create a service for your application.

**1. Create `app-configuration.service.ts`:**

```ts
import { Injectable } from "@nestjs/common"
import { ConfigurationService } from "@clauscode/nestjs-configuration"

import { schema } from "./app.configuration"

@Injectable()
export class AppConfigurationService extends ConfigurationService<
  typeof schema
> {}
```

### 2. Register the configuration module

Register your configuration in your application's root module:

```ts
import { Module } from "@nestjs/common"
import { ConfigurationModule } from "@clauscode/nestjs-configuration"
import { appConfiguration } from "./app.configuration"

@Module({
  imports: [
    ConfigurationModule.register(appConfiguration),
  ],
})
export class AppModule {}
```

### 3. Use your configuration

Choose one of the following approaches to get TypeScript autocomplete and type checking.

#### Option 1: Use `typeof schema`

The simplest approach is to pass your schema type when retrieving the service:

```ts
import { ConfigurationService } from "@clauscode/nestjs-configuration"
import { NestFactory } from "@nestjs/core"

import { AppModule } from "./app.module"
import { schema } from "./app.configuration"

const app = await NestFactory.create(AppModule)

const config = app.get<ConfigurationService<typeof schema>>(
  ConfigurationService,
)

config.get("app.name")     // string
config.get("app.port")     // number
config.get("database.url") // string

config.get("database.unknown") // TypeScript error
```

**Why use `typeof schema`?**

It tells TypeScript to get the configuration types directly from your Zod schema. You don't need to create a separate interface or define the types manually.

#### Option 2: Create a typed service once

If you don't want to write `typeof schema` every time, create a custom service for your application.

**1. Create `app-configuration.service.ts`:**

```ts
import { Injectable } from "@nestjs/common"
import { ConfigurationService } from "@clauscode/nestjs-configuration"

import { schema } from "./app.configuration"

@Injectable()
export class AppConfigurationService extends ConfigurationService<
  typeof schema
> {}
```

**2. Register the service in your `AppModule`:**

```ts
providers: [
  {
    provide: AppConfigurationService,
    useExisting: ConfigurationService,
  },
],
exports: [AppConfigurationService],
```

Keep `ConfigurationModule.register(appConfiguration)` in the module's `imports`, as shown in the previous step.

**3. Inject your custom service wherever you need it:**

```ts
import { Injectable } from "@nestjs/common"
import { AppConfigurationService } from "./app-configuration.service"

@Injectable()
export class AppService {
  constructor(
    private readonly config: AppConfigurationService,
  ) {}

  getPort() {
    return this.config.get("app.port") // number
  }
}
```

That's it! You define the schema type once, and TypeScript autocomplete works wherever you inject `AppConfigurationService`.

**Which option should you choose?**

- **Option 1:** Best if you only need typed access in a few places.
- **Option 2:** Best if you want to inject the configuration throughout your application without repeating `typeof schema`.

## 🛡️ Validation and defaults

Zod lets you express validation rules directly in your schema:

```ts
import { z } from "zod"

const schema = z.object({
  port: z.coerce.number().int().min(1).max(65535),

  logLevel: z.enum([
    "error",
    "warn",
    "info",
    "debug",
  ]).default("info"),

  debug: z.stringbool().default(false),

  apiUrl: z.string().url(),
})
```

This schema ensures that:

- `port` is a valid integer within the allowed range.
- `logLevel` uses one of the supported values.
- `debug` is parsed as a boolean.
- `apiUrl` is a valid URL.

If a required value is missing or invalid, validation fails instead of allowing incorrect configuration to propagate silently.

Defaults are applied when values are missing:

```ts
const schema = z.object({
  appName: z.string().default("my-app"),
  debug: z.stringbool().default(false),
})
```

If neither value is provided, the parsed configuration contains:

```ts
{
  appName: "my-app",
  debug: false,
}
```

## 🧩 Nested configuration

Group related settings into nested objects:

```ts
const schema = z.object({
  app: z.object({
    name: z.string(),
    port: z.number(),
  }),

  database: z.object({
    host: z.string(),
    port: z.number(),
  }),
})
```

Access individual values using dot-separated paths:

```ts
this.config.get("app.name")
this.config.get("app.port")
this.config.get("database.host")
this.config.get("database.port")
```

This keeps configuration organized without sacrificing type safety.

## ⚙️ Asynchronous registration

For configurations that need to be created asynchronously or depend on other providers, the library exposes `ConfigurationModule.registerAsync()`.

The exact options depend on the library's `ConfigurationAsyncOptions` interface. Use this method when your configuration needs dependency injection or asynchronous setup.

## 🏗️ How it works

The configuration lifecycle follows four steps:

1. **Read** environment variables.
2. **Transform** raw environment values into the expected input shape.
3. **Validate** the configuration using the Zod schema.
4. **Access** validated values through `ConfigurationService`.

This separates environment-specific details from the rest of your application and helps catch configuration errors early.

## 🧪 Development

Clone the repository and install dependencies:

```bash
git clone git@gitlab.com:ClausCode/nestjs-configuration.git
cd nestjs-configuration
npm install
```

Run the available checks:

```bash
npm test
npm run check
npm run build
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file.

## 🤝 Contributing

Issues, bug reports, and pull requests are welcome.

If you find a bug or have an idea for an improvement, please open an issue describing the problem or proposed change.

---

Made with ❤️ for the NestJS ecosystem.
