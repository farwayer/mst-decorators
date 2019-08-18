```js
import {model, view, action, flow, ref, bool, array, map, maybe, id, str, jsonDate} from 'mst-decorators'

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

@model class Message {
  @id id
  @ref(User) sender
  @str text
  @jsonDate date
  @bool unread

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
```
