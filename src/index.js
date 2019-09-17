import {
  types as MstTypes,
  flow as mstFlow,
  clone as mstClone,
  onSnapshot as mstOnSnapshot,
  onPatch as mstOnPatch,
  onAction as mstOnAction,
} from 'mobx-state-tree'
import {merge, pick, omit, pipe, map as rdMap, filter, forEach, identity, isEmpty} from 'rambda'
import {
  propertyDecorator, classDecorator, isPropertyDecorator
} from 'decorating'
import {setPrototypeOf, getOwnPropertyDescriptors, capitalize} from './utils'
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

  let props = extractTaggedProps(Class, PropsKey) || {}
  props = rdMap(pipe(
    args => args[0],
    type => getMstType(type) || type,
  ))(props)

  const propKeys = Object.keys(props)
  const viewKeys = extractTaggedPropNames(Class, ViewsKey) || []
  const ownKeys = Object.getOwnPropertyNames(values)
  const omitKeys = ExcludeKeys.concat(propKeys).concat(viewKeys)
  const descs = getOwnPropertyDescriptors(Class.prototype)

  const views = pick(viewKeys, descs)
  const volatile = omit(omitKeys, pick(ownKeys, values))
  const actions = {}

  pipe(
    filter((desc, key) => !omitKeys.includes(key)),
    forEach((desc, key) => {
      const {get, set, value} = desc
      if (get || set) return views[key] = desc
      if (is.fn(value)) return actions[key] = value
    }),
  )(descs)

  const mstType = getMstType(Class)
  let Model = mstType
    ? mstType.named(name).props(props)  // extend base model
    : MstTypes.model(name, props)
  Model = isEmpty(volatile) ? Model : Model.volatile(() => volatile)
  Model = isEmpty(actions) ? Model : modelActions(Model)(() => actions)
  Model = isEmpty(views) ? Model : Model.views(viewBinder(views))

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

export const enumeration = createTypeDecorator(MstTypes.enumeration)
export const _model = createTypeDecorator(MstTypes.model)
export const compose = createTypeDecorator(MstTypes.compose)
export const custom = createTypeDecorator(MstTypes.custom)
export const reference = createTypeDecorator(MstTypes.reference)
export const safeReference = createTypeDecorator(MstTypes.safeReference)
export const union = createTypeDecorator(MstTypes.union)
export const optional = createTypeDecorator(MstTypes.optional)
export const literal = createTypeDecorator(MstTypes.literal)
export const maybe = createTypeDecorator(MstTypes.maybe)
export const maybeNull = createTypeDecorator(MstTypes.maybeNull)
export const refinement = createTypeDecorator(MstTypes.refinement)
export const string = createTypeDecorator(MstTypes.string)
export const boolean = createTypeDecorator(MstTypes.boolean)
export const number = createTypeDecorator(MstTypes.number)
export const integer = createTypeDecorator(MstTypes.integer)
export const date = createTypeDecorator(MstTypes.Date)
export const map = createTypeDecorator(MstTypes.map)
export const array = createTypeDecorator(MstTypes.array)
export const frozen = createTypeDecorator(MstTypes.frozen)
export const identifier = createTypeDecorator(MstTypes.identifier)
export const identifierNumber = createTypeDecorator(MstTypes.identifierNumber)
export const late = createTypeDecorator(MstTypes.late, getDef => () => {
  const def = getDef()
  return getMstType(def) || def
})
export const _undefined = createTypeDecorator(MstTypes.undefined)
export const _null = createTypeDecorator(MstTypes.null)
export const snapshotProcessor = createTypeDecorator(MstTypes.snapshotProcessor)

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
    target[key][property] = args
  })
}

function createTypeDecorator(
  type,
  transformArg = arg => getMstType(arg) || arg,
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
    props: type.props && modelProps(type),
    actions: type.actions && modelActions(type),
    views: type.views && type.views.bind(type),
    volatile: type.volatile && type.volatile.bind(type),
  }
  return Object.assign(fn.bind(type), type)
}

function modelProps(type) {
  return pipe(
    rdMap(prop => getMstType(prop) || prop),
    type.props.bind(type),
  )
}

function modelActions(type) {
  return getActions => type.actions(store => {
    const actions = getActions(store)

    return rdMap(action => {
      const isGen = is.gen(action)
      action = action.bind(store)
      return isGen ? mstFlow(action) : action
    })(actions)
  })
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
