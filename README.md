## mst-decorators

Class based MobX-State-Tree definitions.

Some features:
- very simple syntax without need to use extra helpers etc. Just decorators.
- es6 extending
- access to instance via `this`
- `@view`, `@action`, `@flow`, `@volatile` decorators
- use model class as decorator in another (`@Location`)
- late definition for recursive models (`@late(() => ref(Category)) topCategory`)
- `preProcessSnapshot`/`postProcessSnapshot` as static class methods
- can specify `onPatch`/`onSnapshot`/`onAction` just in class
- lifecycle hook actions, composing and `getEnv()` works as well
- several extra decorators: `@jsonDate`, `@setter`

## How to use

```bash
yarn add mst-decorators
```

```js
import {
  model, view, action, flow, ref, bool, array, map, maybe, id, str, jsonDate,
} from 'mst-decorators'

@model class BaseUser {
  @id id
  @str username
  @str password
}

@model class User extends BaseUser {
  @maybe(str) phone
  @maybe(str) firstName
  @maybe(str) lastName
  
  @view get fullName() {
    if (!this.firstName && !this.lastName) return
    if (!this.lastName) return this.firstName
    if (!this.firstName) return this.lastName
    return `${this.firstName} ${this.lastName}`
  }

  @action setPhone(phone) {
    this.phone = phone
  }
}

@model class Location {
  @num long
  @num lat
}

@model class Message {
  @id id
  @ref(User) sender
  @str text
  @jsonDate date
  @bool unread
  @Location location

  static preProcessSnapshot(snap) {
    //...
  }
  static postProcessSnapshot(snap) {
    //...
  }
  
  onPatch(patch, reversePatch) {
    //...
  }
  onSnapshot(snapshot) {
    //...
  }
  onAction(call) {
    //...
  }
}

@model class Chat {
  @id id
  @array(Message) messages
  @map(User) users

  @action afterCreate() {
    this.fetchMessages()
  }

  @flow fetchMessages = function* () {
    this.messages = yield Api.fetchMessages()
  }
}

const chat = Chat.create({
  id: '1',
})
```

## API

- `@model`
- `@prop`, `@action`, `@view`, `@flow`, `@volatile`
- `@string` (`@str`), `@number` (`@num`), `@integer` (`@int`),
`@boolean` (`@bool`), `@date`, `@map`, `@array`, `@frozen`,
`@identifier` (`@id`), `@identifierNumber` (`@idNum`), `@enumeration`,
`@reference` (`@ref`), `@safeReference` (`@safeRef`), `@union`,
`@optional` (`@opt`), `@maybe`, `@maybeNull`, `@refinement`, `@undef`, `@nul`,
`@late`, `@snapshotProcessor` (`@snapProc`), `@compose`, `@custom`, `@jsonDate`
- `@setter`
- `getMstType`
