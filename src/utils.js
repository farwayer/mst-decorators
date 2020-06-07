import {flow, isType} from 'mobx-state-tree'
import {pipe, map, reduce, toPairs, prop} from 'rambda'
import {isObj, isGen} from 'istp'
import {propertyDecorator, isPropertyDecorator} from 'decorating'
import {whenFn} from './fns'
import {prop as propType} from './basic'


export const TypeKey = tagKey('type')
export const getMstType = prop(TypeKey)

export function propertyTagger(key) {
  return propertyDecorator((target, property, desc, ...args) => {
    target[key] = target[key] || {}
    target[key][property] = args
  })
}

export function createTypeDecorator(
  type,
  transformArgs = transformToMst,
) {
  function decorator(...args) {
    if (isPropertyDecorator(args)) {
      return propType(this)(...args)
    }

    // init if special mst type with options like opt, late, etc
    const initType = typeWithOptions => typeWithOptions(...transformArgs(args))
    const decoratorType = whenFn(initType)(type)

    return bindType(decorator, decoratorType)
  }

  return bindType(decorator, type)
}

export function transformToMst(args) {
  return map(arg => {
    if (isType(arg)) return arg

    const mstType = getMstType(arg)
    if (mstType) return mstType

    return isObj(arg) ? transformToMst(arg) : arg
  }, args)
}

export function bindType(fn, type) {
  type = {
    [TypeKey]: type,
    create: type.create && type.create.bind(type),
    is: type.is && type.is.bind(type),
    validate: type.validate && type.validate.bind(type),
    instantiate: type.instantiate && type.instantiate.bind(type),
    props: type.props && modelProps(type),
    actions: type.actions && modelActions(type),
    views: type.views && type.views.bind(type),
    volatile: type.volatile && type.volatile.bind(type),
  }
  return Object.assign(fn.bind(type), type)
}

function modelProps(type) {
  return pipe(
    convertValuesToMst,
    type.props,
  )
}

export function modelActions(type) {
  return getActions => type.actions(store => {
    const bindAction = action => {
      const fn = action.bind(store)
      return isGen(action) ? flow(fn) : fn
    }

    const actions = getActions(store)
    return map(bindAction, actions)
  })
}

export function convertValuesToMst(obj) {
  return map(val => getMstType(val) || val, obj)
}

export function viewBinder(descs) {
  const getDescsReducer = obj => (resDescs, [key, desc]) => {
    const {get, set, value} = desc
    const newDesc = {enumerable: true}

    // views can be functions only
    if (get) newDesc.get = get.bind(obj)
    if (set) newDesc.set = set.bind(obj)
    if (value) newDesc.value = value.bind(obj)

    resDescs[key] = newDesc
    return resDescs
  }
  const defineViews = descs => Object.defineProperties({}, descs)

  return obj => pipe(
    toPairs,
    reduce(getDescsReducer(obj), {}),
    defineViews,
  )(descs)
}

export function tagKey(tag) {
  return `__mst_decorators_${tag}`
}

export function extractTaggedProps(Class, key) {
  const proto = Class.prototype
  const props = proto[key]
  delete proto[key]
  return props || {}
}
