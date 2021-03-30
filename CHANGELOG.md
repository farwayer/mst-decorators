## Changelog

### 2.1.5

- add `named()`
- fix mst version `3.x.x`

### 2.1.4

- do not throw error if constructor was called (for extending)

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
