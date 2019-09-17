import {
  types as mstTypes,
  flow as mstFlow,
  clone as mstClone,
  onSnapshot as mstOnSnapshot,
  onPatch as mstOnPatch,
  onAction as mstOnAction,
} from 'mobx-state-tree'
import {merge, pick, omit} from 'rambda'
import {
  propertyDecorator, classDecorator, isPropertyDecorator
} from 'decorating'
import {
  setPrototypeOf, getOwnPropertyDescriptors, identity, capitalize, hasKeys
} from './utils'
import * as is from './is'


const TypeKey = tagKey('type')
const PropsKey = tagKey('props')
const ViewsKey = tagKey('views')
const ExcludeKeys = [
  'constructor', 'onPatch', 'onSnapshot', 'onAction',
  TypeKey, PropsKey, ViewsKey,
]

export const model = classDecorator((
  Class,
  name = Class.name,
  options = {auto: false},
) => {
  if (is.obj(name)) {
    options = merge(options, name)
    name = Class.name
  }

  const {preProcessSnapshot, postProcessSnapshot} = Class
  // TS class property initializers and defaults from constructor
  const values = new Class()
  const {onSnapshot, onPatch, onAction} = values

  const props = extractTaggedProps(Class, PropsKey) || {}
  Object.values(props).forEach(({property, args}) => {
    let type = args[0]
    if (type && type[TypeKey]) type = type[TypeKey]
    props[property] = is.def(type) ? type : values[property]
  })

  const propKeys = Object.keys(props)
  const viewKeys = extractTaggedPropNames(Class, ViewsKey) || []
  const ownKeys = Object.getOwnPropertyNames(values)
  const omitKeys = ExcludeKeys.concat(propKeys).concat(viewKeys)
  const descs = getOwnPropertyDescriptors(Class.prototype)

  const views = pick(viewKeys, descs)
  const volatile = omit(omitKeys, pick(ownKeys, values))
  const actions = {}
  const flows = {}

  Object.entries(descs)
    .filter(([key]) => !omitKeys.includes(key))
    .forEach(([key, desc]) => {
      const {get, set, value} = desc
      if (get || set) return views[key] = desc
      if (is.gen(value)) return flows[key] = value
      if (is.fn(value)) return actions[key] = value
    })

  let Model = Class[TypeKey]
    ? Class[TypeKey].named(name).props(props)  // extend base model
    : mstTypes.model(name, props)
  Model = hasKeys(volatile) ? Model.volatile(() => volatile) : Model
  Model = hasKeys(actions) ? Model.actions(binder(actions)) : Model
  Model = hasKeys(flows) ? Model.actions(binder(flows, mstFlow)) : Model
  Model = hasKeys(views) ? Model.views(viewBinder(views)) : Model

  Model = Model.preProcessSnapshot(snapshot => {
    snapshot = preProcessSnapshot ? preProcessSnapshot(snapshot) : snapshot
    if (!is.obj(snapshot)) {
      if (!options.auto) return snapshot
      snapshot = {}
    }
    return merge(values, snapshot)
  })

  if (postProcessSnapshot) {
    Model = Model.postProcessSnapshot(postProcessSnapshot)
  }

  Model = Model.actions(obj => ({
    afterCreate() {
      if (onSnapshot) mstOnSnapshot(obj, onSnapshot.bind(obj))
      if (onPatch) mstOnPatch(obj, onPatch.bind(obj))
      if (onAction) mstOnAction(obj, onAction.bind(obj))
    }
  }))

  const modelDecorator = prop(Model)
  const Constructor = assignType(Model, function (...args) {
    if (isPropertyDecorator(args)) {
      return modelDecorator(...args)
    }

    if (this instanceof Constructor) {
      throw new Error(`You should use ${name}.create() to instantiate object`)
    }
  })

  return setPrototypeOf(Constructor, Class)
})

export const prop = propertyTagger(PropsKey)
export const view = propertyTagger(ViewsKey)

export const enumeration = createTypeDecorator(mstTypes.enumeration)
export const _model = createTypeDecorator(mstTypes.model)
export const compose = createTypeDecorator(mstTypes.compose)
export const custom = createTypeDecorator(mstTypes.custom)
export const reference = createTypeDecorator(mstTypes.reference)
export const safeReference = createTypeDecorator(mstTypes.safeReference)
export const union = createTypeDecorator(mstTypes.union)
export const optional = createTypeDecorator(mstTypes.optional)
export const literal = createTypeDecorator(mstTypes.literal)
export const maybe = createTypeDecorator(mstTypes.maybe)
export const maybeNull = createTypeDecorator(mstTypes.maybeNull)
export const refinement = createTypeDecorator(mstTypes.refinement)
export const string = createTypeDecorator(mstTypes.string)
export const boolean = createTypeDecorator(mstTypes.boolean)
export const number = createTypeDecorator(mstTypes.number)
export const integer = createTypeDecorator(mstTypes.integer)
export const date = createTypeDecorator(mstTypes.Date)
export const map = createTypeDecorator(mstTypes.map)
export const array = createTypeDecorator(mstTypes.array)
export const frozen = createTypeDecorator(mstTypes.frozen)
export const identifier = createTypeDecorator(mstTypes.identifier)
export const identifierNumber = createTypeDecorator(mstTypes.identifierNumber)
export const late = createTypeDecorator(mstTypes.late, getDef => () => {
  const def = getDef()
  return def[TypeKey] || def
})
export const _undefined = createTypeDecorator(mstTypes.undefined)
export const _null = createTypeDecorator(mstTypes.null)
export const snapshotProcessor = createTypeDecorator(mstTypes.snapshotProcessor)

// alias
export const ref = reference
export const safeRef = safeReference
export const opt = optional
export const str = string
export const bool = boolean
export const num = number
export const int = integer
export const id = identifier
export const idNum = identifierNumber
export const undef = _undefined
export const nul = _null
export const snapProc = snapshotProcessor

// extra
export const jsonDate = custom({
  name: 'JSONDate',
  fromSnapshot: val => is.str(val) || is.int(val) ? new Date(val) : val,
  toSnapshot: date => date.toJSON(),
  isTargetType: date => date instanceof Date,
  getValidationMessage: val => is.nul(val) || !is.def(val)
    ? "null or undefined is not a valid value for JSONDate"
    : "",
})

export const types = {
  enumeration, model: _model, compose, custom, reference, safeReference,
  union, optional, literal, maybe, maybeNull, refinement,
  string, boolean, number, integer, date, map, array, frozen,
  identifier, identifierNumber, late, undefined: _undefined, null: _null,
  snapshotProcessor,
  ref, safeRef, opt, str, bool, num, int, id, idNum, undef, nul,
  snapProc,
  jsonDate,
}

export const setter = propertyDecorator((
  target, prop, desc,
  {
    name = setterName(prop),
    value: customValue,
    clone,
    keepEnvironment = false,
  } = {},
) => {
  target[name] = function (value) {
    if (is.def(customValue)) {
      value = is.fn(customValue)
        ? customValue.call(this, value)
        : customValue
    }

    this[prop] = is.def(value) && clone
      ? mstClone(value, keepEnvironment)
      : value
  }
})

export function getMstType(type) {
  return type && type[TypeKey]
}


function propertyTagger(key) {
  return propertyDecorator((target, property, desc, ...args) => {
    target[key] = target[key] || {}
    target[key][property] = {target, property, desc, args}
  })
}

function createTypeDecorator(
  type,
  transformArg = arg => arg && arg[TypeKey] || arg,
) {
  return assignType(type, function decorator(...args) {
    if (isPropertyDecorator(args)) {
      return prop(this)(...args)
    }

    const decoratorType = is.fn(type)
      ? type(...args.map(transformArg))
      : type
    return assignType(decoratorType, decorator)
  })
}

function assignType(type, fn) {
  type = {
    [TypeKey]: type,
    create: type.create && type.create.bind(type),
    is: type.is && type.is.bind(type),
    validate: type.validate && type.validate.bind(type),
    instantiate: type.instantiate && type.instantiate.bind(type),
    actions: type.actions && type.actions.bind(type),
    views: type.views && type.views.bind(type),
    volatile: type.volatile && type.volatile.bind(type),
  }
  return Object.assign(fn.bind(type), type)
}

function binder(fns, transform = identity) {
  return obj => (
    Object.entries(fns).reduce((fns, [fnName, fn]) => {
      if (!is.fn(fn)) {
        throw new Error(`${fnName} must be function`)
      }

      fns[fnName] = transform(fn.bind(obj))
      return fns
    }, {})
  )
}

function viewBinder(descs) {
  return obj => (
    Object.entries(descs).reduce((fns, [key, desc]) => {
      desc = descBind(obj, desc, 'get')
      desc = descBind(obj, desc, 'set')
      desc = descBind(obj, desc, 'value')
      desc = {...desc, enumerable: true}
      return Object.defineProperty(fns, key, desc)
    }, {})
  )
}

function descBind(obj, desc, fnName) {
  const fn = desc[fnName]
  if (!is.fn(fn)) return desc
  return {...desc, [fnName]: fn.bind(obj)}
}

function tagKey(tag) {
  return `__mst_decorators_${tag}`
}

export function setterName(prop, prefix = 'set') {
  const Name = capitalize(prop)
  return prefix + Name
}

function extractTaggedProps(Class, key) {
  const proto = Class.prototype
  const props = proto[key]
  delete proto[key]
  return props
}

function extractTaggedPropNames(Class, key) {
  const props = extractTaggedProps(Class, key)
  return props && Object.keys(props)
}
