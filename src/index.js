import {
  types as MstTypes,
  flow as mstFlow,
  clone as mstClone,
  onSnapshot as mstOnSnapshot,
  onPatch as mstOnPatch,
  onAction as mstOnAction,
  isType as mstIsType,
  resolveIdentifier, getRoot, isStateTreeNode, getIdentifier,
} from 'mobx-state-tree'
import {
  merge, pick, omit, pipe, map as rdMap, filter, forEach, isEmpty, reduce,
  toPairs, prop as rdProp, when,
} from 'rambda'
import {isFn, isDef, isObj, isStr, isInt, isNul, isGen} from 'istp'
import {
  propertyDecorator, classDecorator, isPropertyDecorator,
} from 'decorating'
import {getOwnPropertyDescriptors, capitalize} from './utils'
import {whenFn} from './fns'


const TypeKey = tagKey('type')
const PropsKey = tagKey('props')
const ViewsKey = tagKey('views')
const ExcludeKeys = [
  'constructor', 'onPatch', 'onSnapshot', 'onAction',
  TypeKey, PropsKey, ViewsKey,
]

export const getMstType = rdProp(TypeKey)

export const model = classDecorator((
  Class,
  name = Class.name,
  options = {auto: false},
) => {
  if (isObj(name)) {
    options = merge(options, name)
    name = Class.name
  }

  const {preProcessSnapshot, postProcessSnapshot} = Class
  // TS class property initializers and defaults from constructor
  const values = new Class()
  const {onSnapshot, onPatch, onAction} = values

  let props = extractTaggedProps(Class, PropsKey)
  props = pipe(
    rdMap(args => args[0]),
    convertValuesToMst,
  )(props)

  const propKeys = Object.keys(props)
  const viewKeys = Object.keys(extractTaggedProps(Class, ViewsKey))
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
      if (isFn(value)) return actions[key] = value
    }),
  )(descs)

  const mstType = getMstType(Class) // es6 extending
  let Model = mstType
    ? mstType.named(name).props(props)
    : MstTypes.model(name, props)

  Model = isEmpty(volatile) ? Model : Model.volatile(() => volatile)
  Model = isEmpty(actions) ? Model : modelActions(Model)(() => actions)
  Model = isEmpty(views) ? Model : Model.views(viewBinder(views))

  Model = Model.preProcessSnapshot(snapshot => {
    snapshot = preProcessSnapshot ? preProcessSnapshot(snapshot) : snapshot
    if (!isObj(snapshot)) {
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
    },
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

  return Object.setPrototypeOf(Constructor, Class)
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
    if (isDef(customValue)) {
      value = whenFn(customValue => customValue.call(this, value))
    }

    this[prop] = isDef(value) && clone
      ? mstClone(value, keepEnvironment)
      : value
  }
})

// extra
export const jsonDate = custom({
  name: 'JSONDate',
  fromSnapshot: val => isStr(val) || isInt(val) ? new Date(val) : val,
  toSnapshot: date => date.toJSON(),
  isTargetType: date => date instanceof Date,
  getValidationMessage: val => isNul(val) || !isDef(val)
    ? "null or undefined is not a valid value for JSONDate"
    : "",
})

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

export const weakRef = weakReference
export const valuesEnum = valuesEnumeration

export const types = {
  enumeration, model: _model, compose, custom, reference, safeReference,
  union, optional, literal, maybe, maybeNull, refinement,
  string, boolean, number, integer, date, map, array, frozen,
  identifier, identifierNumber, late, undefined: _undefined, null: _null,
  snapshotProcessor,
  ref, safeRef, opt, str, bool, num, int, id, idNum, undef, nul, snapProc,
  jsonDate, weakReference, valuesEnumeration,
  weakRef, valuesEnum,
}


// private
function propertyTagger(key) {
  return propertyDecorator((target, property, desc, ...args) => {
    target[key] = target[key] || {}
    target[key][property] = args
  })
}

function createTypeDecorator(
  type,
  transformArg = transformArgToMst,
) {
  return assignType(type, function decorator(...args) {
    if (isPropertyDecorator(args)) {
      return prop(this)(...args)
    }

    const decoratorType = whenFn(type => type(...args.map(transformArg)))(type)
    return assignType(decoratorType, decorator)
  })
}

function transformArgToMst(arg) {
  if (mstIsType(arg)) return arg

  const mstType = getMstType(arg)
  if (mstType) return mstType

  return isObj(arg) ? convertValuesToMst(arg) : arg
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
    convertValuesToMst,
    type.props,
  )
}

function modelActions(type) {
  return getActions => type.actions(store => {
    const bindAction = action => {
      const fn = action.bind(store)
      return isGen(action) ? mstFlow(fn) : fn
    }

    const actions = getActions(store)
    return rdMap(bindAction, actions)
  })
}

function convertValuesToMst(obj) {
  return rdMap(val => getMstType(val) || val, obj)
}

function viewBinder(descs) {
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
  return props || {}
}
