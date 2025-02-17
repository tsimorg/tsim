# @tsim/model

This is a decorator based library for serialization and validation. It is an alternative to combination of class-transform and class-validator libraries.

# Installation

```bash
npm install @tsim/model --save
```

# Methods

## serialize

```typescript
import { serialize } from '@tsim/model/transform';

const userData = serialize(user);
```

## deserialize

```typescript
import { deserialize } from '@tsim/model/transform';

const user = deserialize(UserEntity, userData);
```

## validate

```typescript
import { deserialize } from '@tsim/model/transform';
import { validate } from '@tsim/model/validate';

const user = deserialize(UserEntity, userData);
const errors = validate(user);
```

## create

This method combine both transform and validation together.

```typescript
import { create } from '@tsim/model/model';

const user = create(UserEntity, userData);
```

## createList

```typescript
import { createList } from '@tsim/model/model';

const users = createList(UserEntity, usersDataList);
```
