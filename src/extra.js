import {
  clone, resolveIdentifier, getRoot, isStateTreeNode, getIdentifier,
} from 'mobx-state-tree'
import {when} from 'rambda'
import {isDef} from 'istp'
import {propertyDecorator} from 'decorating'
import {capitalize, whenFn} from './fns'
import {getMstType} from './utils'
import {maybe, ref, enumeration, str} from './basic'


export const weakReference = type => maybe(ref(type, {
  get(id, parent) {
    return resolveIdentifier(getMstType(type), getRoot(parent), id)
  },
  set(id) {
    return when(isStateTreeNode, getIdentifier)(id)
  },
}))

export const valuesEnumeration = (obj, strict = false) => {
  const type = enumeration(Object.values(obj))
  return strict ? type : union(type, str)
}

export const setter = propertyDecorator((
  target, prop, desc,
  {
    name = setterName(prop),
    value: customValue,
    clone: needClone,
    keepEnvironment = false,
  } = {},
) => {
  target[name] = function (value) {
    if (isDef(customValue)) {
      value = whenFn(customValue => customValue.call(this, value))
    }

    this[prop] = isDef(value) && needClone
      ? clone(value, keepEnvironment)
      : value
  }
})

// alias
export const weakRef = weakReference
export const valuesEnum = valuesEnumeration
export const extraTypes = {
  weakReference, valuesEnumeration, setter,
  weakRef, valuesEnum,
}


function setterName(prop, prefix = 'set') {
  const Name = capitalize(prop)
  return prefix + Name
}
