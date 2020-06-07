## Changelog

### 3.0.0

**Breaking:**
- options argument with `auto` removed from `model()`
- MST `types.model` (and `_model`) removed. Model can be initialized with object
like MST model or with MST model now.

Other:
- add missed `jsonDate` to exported `types`
- weakRef  
Like `safeRef` but do not set value to `undefined` if reference node not found  
- valuesEnum
```js
export const AddressType = {
  Legal: 'legal',
  Actual: 'actual',
  Postal: 'postal',
}

const strict = true // no other types can be
const AddressTypeEnum = valuesEnum(AddressType, strict)
```

### 2.1.3

- fix incorrect gen check

### 2.1.2

- optimize creating objects with many views
- @babel/runtime
- sideEffects: false

### 2.1.1

- check if mst type already while converting type arguments

### 2.1.0

- model props() and actions() for extending
- getMstType() TS def

### 2.0.1

- correcting MST peer version

### 2.0.0

- `@flow` and `@action` decorators removed. All simple functions
(except `@view`'ed) will be considered as actions. All generators will become
flow's. getters will become views. Use `@view` for parametrized views.
- field with model type will not be automatically initialized with empty objects
any more. So this code will throw error in new version:
```js
@model class Base {}

@model class Container {
  @Base base
}
```

Use default value
```js
@model class Container {
  @Base base = {}
}
```
or `auto: true` option instead:
```js
@model({auto: true}) class Base {}

@model class Container {
  @Base base
}
```
- basic typescript definitions

### 1.0.0

- initial version
