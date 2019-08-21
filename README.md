## mst-decorators

Class based MobX-State-Tree definitions.

Some features:
- simple syntax without need to use extra helpers etc, just type decorators
- es6 extending
- autodetect actions, flows, getter views, volatile
- actions and flows auto-bind to model so you can pass it to callbacks without
worrying about `this` context
- result of decorator function is decorator. Feel power in constructing types! 
- model class is decorator so it can be used in another model (`@Location`)
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
import {getEnv} from 'mobx-state-tree'
import {model, view, ref, bool, array, map, maybe, id, str, jsonDate} from 'mst-decorators'

@model class BaseUser {
  @id id
  @str username
  @str password
}

@model class User extends BaseUser {
  @maybe(str) phone
  @maybe(str) firstName
  @maybe(str) lastName
  
  // view
  get fullName() {
    if (!this.firstName && !this.lastName) return
    if (!this.lastName) return this.firstName
    if (!this.firstName) return this.lastName
    return `${this.firstName} ${this.lastName}`
  }

  // view with parameter
  @view prefixName(prefix) {
    return `${prefix} ${this.fullName}`
  }

  // action
  setPhone(phone) {
    this.phone = phone
  }
}

@model class Location {
  @num long
  @num lat
}

const Sender = maybe(ref(User))

@model class Message {
  @id id
  @Sender sender
  @str text
  @jsonDate date
  @bool unread = true
  @model(class {
    @maybe(Location) location
    @array(str) files
    @array(str) images
  }) attachments

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

  api = undefined // volatile

  // lifecycle hook action
  afterCreate() {
    this.api = getEnv(this)
  }

  // flow
  *fetchMessages() {
    this.messages = yield this.api.fetchMessages(this.id)
  }
}

const chat = Chat.create({id: '1'})
chat.fetchMessages()
```

## TS

Because class decorator can't modify type declaration in TS you should use
`model` function instead `@model` decorator.

```js
class Message {
  @str text
}

export default model(Message)
```

```js
import Message from './message'

class Chat {
  @array(Message) text
}

export default model(Chat)
```

## API

- `@model`
- `@prop`, `@view`, `@volatile`
- `@string` (`@str`), `@number` (`@num`), `@integer` (`@int`),
`@boolean` (`@bool`), `@date`, `@map`, `@array`, `@frozen`,
`@identifier` (`@id`), `@identifierNumber` (`@idNum`), `@enumeration`,
`@reference` (`@ref`), `@safeReference` (`@safeRef`), `@union`,
`@optional` (`@opt`), `@maybe`, `@maybeNull`, `@refinement`, `@undef`, `@nul`,
`@late`, `@snapshotProcessor` (`@snapProc`), `@compose`, `@custom`, `@jsonDate`
- `@setter`
- `getMstType`
