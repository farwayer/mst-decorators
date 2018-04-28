import {types as mstTypes, flow as mstFlow} from 'mobx-state-tree'
import defaults from 'lodash.defaults'
import pick from 'lodash.pick'
import {decorateProperty, decorateClass, isPropertyDecorator} from './decorate'
import {
  setPrototypeOf, getPrototypeOf, getOwnPropertyDescriptors,
  identity, setterName, isFunction, isDefined,
} from './utils'


const TypeKey = getTagKey('type');
const PropsKey = getTagKey('props');
const ActionsKey = getTagKey('actions');
const FlowsKey = getTagKey('flows');
const ViewsKey = getTagKey('views');
const VolatilesKey = getTagKey('volatiles');


export function model() {
  return decorateClass(arguments, (Class, name=Class.name) => {
    const {preProcessSnapshot} = Class;
    // TS class property initializers and defaults from constructor
    const values = new Class();

    let props = extractTaggedProp(Class, PropsKey) || {};
    const propValues = pick(values, Object.keys(props));
    props = defaults(props, propValues); // mst primitives

    let actions = extractTaggedProp(Class, ActionsKey);
    actions = actions && pick(values, actions);

    let volatile = extractTaggedProp(Class, VolatilesKey);
    volatile = volatile && pick(values, volatile);

    let flows = extractTaggedProp(Class, FlowsKey);
    flows = flows && pick(values, flows);

    let views = extractTaggedProp(Class, ViewsKey);
    if (views) {
      const descs = getOwnPropertyDescriptors(getPrototypeOf(values));
      views = pick(descs, views);
    }

    let Model = Class[TypeKey]
      ? Class[TypeKey].named(name).props(props)  // extend base model
      : mstTypes.model(name, props);
    Model = volatile ? Model.volatile(() => volatile) : Model;
    Model = actions ? Model.actions(binder(actions)) : Model;
    Model = flows ? Model.actions(binder(flows, mstFlow)) : Model;
    Model = views ? Model.views(viewBinder(views)) : Model;

    Model = Model.preProcessSnapshot(snapshot => {
      snapshot = defaults(snapshot, values);
      return preProcessSnapshot ? preProcessSnapshot(snapshot) : snapshot;
    });

    Model = Model.actions(obj => ({
      afterCreate: () => setPrototypeOf(obj, Class.prototype),
    }));

    const modelDecorator = prop(Model);
    const Constructor = setPrototypeOf((...args) => {
      return isPropertyDecorator(args)
        ? modelDecorator(...args)
        : Model.create(...args);
    }, Class);

    return Object.assign(Constructor, {
      create: Model.create.bind(Model),
      is: Model.is.bind(Model),
      [TypeKey]: Model,
    });
  });
}

export function prop() {
  return decorateProperty(arguments, (target, prop, desc, type) => {
    if (type && type[TypeKey]) type = type[TypeKey];
    target[PropsKey] = {...target[PropsKey], [prop]: type};
  });
}

export const action = propertyTagger(ActionsKey);
export const volatile = propertyTagger(VolatilesKey);
export const flow = propertyTagger(FlowsKey);
export const view = propertyTagger(ViewsKey);

export const enumeration = createTypeDecorator(mstTypes.enumeration);
export const compose = createTypeDecorator(mstTypes.compose);
export const custom = createTypeDecorator(mstTypes.custom);
export const reference = createTypeDecorator(mstTypes.reference);
export const union = createTypeDecorator(mstTypes.union);
export const optional = createTypeDecorator(mstTypes.optional);
export const literal = createTypeDecorator(mstTypes.literal);
export const maybe = createTypeDecorator(mstTypes.maybe);
export const refinement = createTypeDecorator(mstTypes.refinement);
export const string = createTypeDecorator(mstTypes.string);
export const boolean = createTypeDecorator(mstTypes.boolean);
export const number = createTypeDecorator(mstTypes.number);
export const date = createTypeDecorator(mstTypes.Date);
export const map = createTypeDecorator(mstTypes.map);
export const array = createTypeDecorator(mstTypes.array);
export const frozen = createTypeDecorator(mstTypes.frozen);
export const identifier = createTypeDecorator(mstTypes.identifier);
export const late = createTypeDecorator(mstTypes.late);
export const _model = createTypeDecorator(mstTypes.model);
export const _undefined = createTypeDecorator(mstTypes.undefined);
export const _null = createTypeDecorator(mstTypes.null);
export const ref = reference; // alias
export const id = identifier; // alias
export const str = string; // alias
export const num = number; // alias
export const opt = optional; // alias
export const bool = boolean; // alias
export const types = {
  enumeration, compose, custom, reference, union, optional, literal, maybe,
  refinement, string, boolean, number, date, map, array, frozen, identifier,
  late, model: _model, undefined: _undefined, null: _null,
  ref, id, str, num, opt, bool,
};

export function setter() {
  return decorateProperty(arguments, (target, prop, desc, name, customValue) => {
    if (isFunction(name)) {customValue = name; name = undefined;}
    name = name || setterName(prop);

    target[name] = function (value) {
      if (isDefined(customValue)) {
        value = isFunction(customValue)
          ? customValue.call(this, value)
          : customValue;
      }

      this[prop] = value;
    };

    action(target, name, {});
  })
}


function propertyTagger(key) {
  return (...args) => {
    return decorateProperty(args, (target, property) => {
      target[key] = (target[key] || []).concat(property);
    });
  }
}

function createTypeDecorator(type) {
  return bindDecoratorType(type, function decorator(...args) {
    if (isPropertyDecorator(args)) {
      return prop(this)(...args);
    }

    const decoratorType = type(...args.map(arg => arg[TypeKey] || arg));
    return bindDecoratorType(decoratorType, decorator);
  });
}

function bindDecoratorType(type, decorator) {
  type = {[TypeKey]: type};
  return Object.assign(decorator.bind(type), type);
}

function binder(fns, transform=identity) {
  return obj => (
    Object.entries(fns).reduce((fns, [fnName, fn]) => {
      if (!isFunction(fn)) {
        throw new Error(`${fnName} must be function`);
      }

      fns[fnName] = transform(fn.bind(obj));
      return fns;
    }, {})
  )
}

function viewBinder(descs) {
  return obj => (
    Object.entries(descs).reduce((fns, [name, desc]) => {
      desc = descBind(obj, desc, 'get');
      desc = descBind(obj, desc, 'set');
      desc = descBind(obj, desc, 'value');
      desc = {...desc, enumerable: true};
      return Object.defineProperty(fns, name, desc);
    }, {})
  )
}

function descBind(obj, desc, fnName) {
  const fn = desc[fnName];
  if (!isFunction(fn)) return desc;
  return {...desc, [fnName]: fn.bind(obj)};
}

function getTagKey(tag) {
  return `__mst_decorators_${tag}`;
}

function extractTaggedProp(Class, key) {
  const proto = Class.prototype;
  const props = proto[key];
  delete proto[key];
  return props;
}
