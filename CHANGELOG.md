## Changelog

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
