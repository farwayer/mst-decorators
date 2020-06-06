import {
  types as MstTypes,
  onSnapshot as mstOnSnapshot,
  onPatch as mstOnPatch,
  onAction as mstOnAction,
} from 'mobx-state-tree'
import {
  merge, pick, omit, pipe, map as rdMap, filter, forEach, isEmpty,
} from 'rambda'
import {isFn, isObj} from 'istp'
import {classDecorator, isPropertyDecorator} from 'decorating'
import {getOwnPropertyDescriptors} from './legacy'
import {
  TypeKey, getMstType, tagKey, extractTaggedProps, convertValuesToMst,
  propertyTagger, createTypeDecorator, bindType, modelActions, viewBinder,
} from './utils'


const PropsKey = tagKey('props')
const ViewsKey = tagKey('views')
const ExcludeKeys = [
  'constructor', 'onPatch', 'onSnapshot', 'onAction',
  TypeKey, PropsKey, ViewsKey,
]

export const prop = propertyTagger(PropsKey)
export const view = propertyTagger(ViewsKey)

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
  const Constructor = bindType(function (...args) {
    if (isPropertyDecorator(args)) {
      return modelDecorator(...args)
    }

    if (this instanceof Constructor) {
      throw new Error(`You should use ${name}.create() to instantiate object`)
    }
  }, Model)

  return Object.setPrototypeOf(Constructor, Class)
})

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
export const late = createTypeDecorator(MstTypes.late, args => {
  const [getDef] = args

  return [
    () => {
      const def = getDef()
      return getMstType(def) || def
    },
  ]
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
