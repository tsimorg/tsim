# @tsim/model

A lightweight, decorator-based library for turning plain data (JSON, form payloads, database rows, ...) into typed class
instances — with validation built in. It covers the same ground as combining `class-transformer` and `class-validator`,
but as a single small package with one decorator (`@Field`) and no `reflect-metadata` dependency.

- **One decorator** — `@Field(type, required, options)` declares type, required-ness, validation and (de)serialization
  behavior for a property in one place.
- **Deserialize + validate in one step** — `create()` builds an instance from raw data and throws a structured
  `ModelError` if anything fails validation.
- **Nested models & arrays** — models can contain other models, and arrays of primitives or models, out of the box.
- **Renaming, exclusion & custom transforms** — map `snake_case` wire fields to `camelCase` properties, hide secrets
  from serialized output, or plug in fully custom conversion logic per field.
- **No `reflect-metadata`** — field metadata is stored directly on the prototype, so there's nothing to configure in
  `tsconfig.json` and no polyfill to import.

## Installation

```bash
npm install @tsim/model --save
```

## Quick start

```typescript
import { Field, Model, MinLength, IsEmail } from '@tsim/model';

class Address extends Model {
  @Field(String, true)
  city!: string;

  @Field(String, true)
  zip!: string;
}

class User extends Model {
  @Field(String, true)
  id!: string;

  @Field(String, true, { alias: 'full_name', validators: [MinLength(2)] })
  name!: string;

  @Field(String, true, { validators: [IsEmail()] })
  email!: string;

  @Field(Number, false)
  age?: number;

  @Field(Address, true, { nested: true })
  address!: Address;

  @Field([String], false)
  tags?: string[];
}

const user = User.create({
  id: '1',
  full_name: 'Ada Lovelace',
  email: 'ada@example.com',
  address: { city: 'London', zip: 'SW1A 1AA' },
});

user instanceof User; // true
user.name; // 'Ada Lovelace' (mapped from `full_name`)

User.toObject(user);
// => { id: '1', full_name: 'Ada Lovelace', email: 'ada@example.com', address: { city: 'London', zip: 'SW1A 1AA' } }

User.create({ id: '1', full_name: 'A', email: 'not-an-email', address: {} });
// throws ModelError: "User has failed validations"
```

Everything below can also be used as free functions (`deserialize`, `serialize`, `validate`, `create`, ...) imported
from `@tsim/model` if you don't want your classes to extend `Model`.

## Defining fields

```typescript
Field(type: ClassType | [ClassType], required: boolean, options?: FieldOptions): PropertyDecorator
```

| Parameter  | Description                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `type`     | The property's type: `String`, `Number`, `Boolean`, `Date`, another `Model` class, or `[Type]` for an array of `Type`. |
| `required` | Whether the field must be present and non-`null`/`undefined` to pass validation.                 |
| `options`  | See [`FieldOptions`](#fieldoptions) below.                                                       |

For `String`, `Number`, `Boolean` and `Date`, a matching type validator (`IsString`, `IsNumber`, `IsBoolean`, `IsDate`)
is automatically added as the first validator for the field — you only need to supply validators for extra rules.

### `FieldOptions`

| Option           | Type                     | Description                                                                                                    |
| ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `alias`          | `string`                 | The key used when reading/writing the raw object, if different from the property name (e.g. `snake_case` <-> `camelCase`). |
| `validators`     | `ValidationFn[]`         | Extra validators run against the field's value (or each array item, when `type` is `[Type]`).                    |
| `arrayValidators`| `ValidationFn[]`         | Validators run against the array itself (e.g. `ArrayMinLength`, `ArrayUnique`) before individual items are checked. |
| `nested`         | `boolean`                | Treat the value as another model: deserializes/serializes/validates recursively instead of as a primitive.        |
| `exclude`        | `boolean`                | Omit the field when serializing with `serialize()` / `toObject()`. The field is still deserialized and validated. |
| `toModel`        | `TransformFn`            | Custom conversion from raw data to the model property, replacing the default coercion.                           |
| `toObject`       | `TransformFn`            | Custom conversion from the model property back to raw data, replacing the default serialization.                 |
| `groups`         | `string[]`               | Free-form tags attached to the field's metadata, for consumers that build their own group-based logic on top of `getFields()`. Not filtered by `validate`/`serialize` themselves. |
| `extra`          | `Dictionary`             | Free-form metadata bag attached to the field, for the same kind of external consumption (e.g. OpenAPI schema generation). |

## Reading & writing data

### `deserialize(Cls, data)`

Builds a `Cls` instance from a raw object, coercing primitive types, applying `alias`, `nested` and `toModel`, but
**without validating**.

```typescript
import { deserialize } from '@tsim/model';

const user = deserialize(User, rawData);
```

### `validate(instance)`

Validates an already-built instance against its field validators and returns a flat list of `ValidationError`s (empty
if the instance is valid). Nested model errors are attached under `children`.

```typescript
import { validate } from '@tsim/model';

const errors = validate(user);
// [{ target, property: 'email', value: 'not-an-email', message: 'Value is not valid email' }, ...]
```

### `create(Cls, data)` / `createList(Cls, dataArray)`

Combines `deserialize` + `validate`: returns a valid instance, or throws a `ModelError` describing every failing
field. `createList` maps `create` over an array of raw objects.

```typescript
import { create, createList } from '@tsim/model';

const user = create(User, rawData);
const users = createList(User, [rawData, rawData]);
```

### `serialize(instance)` / `toObject(instance)`

Converts an instance back into a plain object, applying `alias`, `nested`, `exclude` and `toObject`. `toObject` is an
alias of `serialize` kept for symmetry with `Model.toObject`.

```typescript
import { serialize } from '@tsim/model';

const raw = serialize(user);
```

### `getFields(Cls)`

Returns the raw field metadata registered for a class (`{ [property]: FieldMeta }`) — useful for building tooling on
top of models (schema generation, admin UIs, etc.) without re-declaring the field list.

## Using the `Model` base class

Extending `Model` puts the same functions on the class as static methods, so you don't need to import the free
functions everywhere:

```typescript
class User extends Model {
  /* ...fields... */
}

User.create(data); // === create(User, data)
User.createList(dataArray); // === createList(User, dataArray)
User.toObject(user); // === toObject(user)
User.getFields(); // === getFields(User)
```

Extending `Model` is optional — every one of these is also exported as a standalone function for classes that need to
extend something else.

## Handling validation errors — `ModelError`

`create` / `createList` throw a `ModelError` when validation fails. It flattens `ValidationError[]` into a
`{ [path]: string[] }` map, using dotted paths for nested models:

```typescript
try {
  User.create(rawData);
} catch (error) {
  if (error instanceof ModelError) {
    error.errors; // { email: ['Value is not valid email'], 'address.city': ['Value is required'] }
    error.serialize(); // '{"User":{"email":["Value is not valid email"]}}'
    error.getResponse(); // { statusCode: 400, message: 'Model Validation Exception', errors: { User: { ... } } }
  }
}
```

`getResponse()` returns a shape ready to send straight back as an HTTP 400 body (e.g. from a NestJS exception filter
or an Express error handler).

## Built-in validators

All validators are factory functions returning a `ValidationFn`, so they're used as `Validator()` (or `Validator(arg)`)
inside a field's `validators` / `arrayValidators` array.

| Validator                    | Passes when...                                             |
| ----------------------------- | ----------------------------------------------------------- |
| `IsRequired()`                 | value is not `null`/`undefined` (applied automatically for required fields) |
| `IsString()` / `IsNumber()` / `IsBoolean()` / `IsDate()` | value is of the matching primitive type (applied automatically based on `@Field` type) |
| `IsArray()`                     | value is an array (applied automatically when `type` is `[Type]`) |
| `IsObject()`                    | value is an object                                          |
| `IsInstance(Type)`              | value is an `instanceof Type`                               |
| `IsIn(values)`                  | value is one of `values`                                    |
| `IsMap()` / `IsSet()`           | value is a `Map` / `Set`                                     |
| `IsEmail()`                     | value is a syntactically valid email address                |
| `IsPattern(regex \| string)`    | value matches the given `RegExp`                             |
| `MinLength(n)` / `MaxLength(n)` | string length is `>= n` / `<= n`                             |
| `Min(n)` / `Max(n)`             | numeric value is `>= n` / `<= n`                             |
| `ArrayMinLength(n)` / `ArrayMaxLength(n)` | array length is `>= n` / `<= n`                    |
| `ArrayContains(item)` / `ArrayNotContains(item)` | array does / does not include `item`      |
| `ArrayUnique()`                 | array has no duplicate items                                 |

```typescript
class User extends Model {
  @Field(String, true, { validators: [MinLength(2), MaxLength(64)] })
  name!: string;

  @Field([String], true, { arrayValidators: [ArrayMinLength(1), ArrayUnique()] })
  tags!: string[];
}
```

## Writing custom validators

A validator is just a function of shape `ValidationFn = (params: ValidationParams) => null | { message, params? }`,
where `null` means "valid":

```typescript
import { ValidationFn } from '@tsim/model';

const IsEven = (): ValidationFn => ({ value }) => (Number(value) % 2 === 0 ? null : { message: 'Value must be even' });

class Batch extends Model {
  @Field(Number, true, { validators: [IsEven()] })
  size!: number;
}
```

`message` supports positional placeholders (`[0]`, `[1]`, ...) filled in from the optional `params` array — see how
`MinLength`/`Max`/`ArrayContains` build their messages for reference.

## Arrays

Pass a single-element array as the `type` (e.g. `[Group]`, `[String]`) to mark a field as a collection. The field's
`validators` run against each item, and `arrayValidators` run against the array as a whole:

```typescript
class User extends Model {
  @Field([Date], true)
  loginDates!: Date[];

  @Field([Group], true, { nested: true, arrayValidators: [ArrayMinLength(1)] })
  groups!: Group[];
}
```

## Nested models

Set `nested: true` on a field whose `type` is another model (or `[Model]` for an array of models). Nested values are
recursively deserialized, serialized, and validated — nested validation errors are attached as `children` on the
parent's `ValidationError` and flattened into dotted paths (`group.title`) by `ModelError`.

```typescript
class Group extends Model {
  @Field(String, true, { validators: [MinLength(3)] })
  title!: string;
}

class User extends Model {
  @Field(Group, true, { nested: true })
  group!: Group;
}
```

## Renaming fields with `alias`

Use `alias` when the wire format's key doesn't match the property name (e.g. `snake_case` payloads with `camelCase`
models). Both `deserialize` and `serialize` respect it:

```typescript
class User extends Model {
  @Field(String, true, { alias: 'first_name' })
  name!: string;
}

User.create({ first_name: 'Ada' }).name; // 'Ada'
User.toObject(user); // { first_name: 'Ada' }
```

## Excluding fields from output

`exclude: true` keeps a field deserialized and validated, but drops it from `serialize()` / `toObject()` — handy for
secrets like passwords:

```typescript
class User extends Model {
  @Field(String, true, { exclude: true })
  password!: string;
}

User.toObject(user); // password is not present
```

## Custom transforms

For conversions the built-in coercion can't express, provide `toModel` and/or `toObject` directly — they fully
replace the default logic for that field:

```typescript
class Order extends Model {
  @Field(Number, true, {
    toModel: value => Number(value) / 100, // cents -> dollars on the way in
    toObject: value => Math.round(Number(value) * 100), // dollars -> cents on the way out
  })
  amount!: number;
}
```

`TransformFn` receives `(value, data, property)`, where `data` is the full raw object/model being converted — useful
when a field's value depends on a sibling field.

## Field effects (advanced)

`registerFieldEffect` lets you hook into every `@Field` declaration as it's applied, across the whole process — this
is the extension point other packages can use to layer extra behavior (e.g. wiring fields into a schema builder or an
ORM) on top of `@tsim/model` without modifying it:

```typescript
import { registerFieldEffect } from '@tsim/model';

registerFieldEffect(({ target, property, meta }) => {
  // e.g. mirror field metadata into another decorator system
});
```

Most applications never need this — it exists for library authors building on top of `@tsim/model`.

## TypeScript reference

The most commonly used types, all exported from `@tsim/model`:

```typescript
type ClassType<T = unknown> = { new (...args: unknown[]): T };
type ValidationFn = (params: { target: object; property: string; value: unknown }) => null | { message: string; params?: string[] };
type TransformFn = (value: unknown, data: Dictionary, property: string) => unknown;
type ValidationError = { target: object; property: string; value: unknown; message?: string; params?: string[]; children?: ValidationError[] };
```
