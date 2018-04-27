export function getPrototypeOf(target) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(target);
  }

  return target.__proto__;
}

export function setPrototypeOf(target, proto) {
  if (Object.setPrototypeOf) {
    return Object.setPrototypeOf(target, proto);
  }

  target.__proto__ = proto;
  return target;
}

export function getOwnPropertyDescriptors(obj) {
  if (Object.getOwnPropertyDescriptors) {
    return Object.getOwnPropertyDescriptors(obj);
  }

  return Object.getOwnPropertyNames(obj).reduce((descs, prop) => {
    descs[prop] = Object.getOwnPropertyDescriptor(obj, prop);
    return descs;
  }, {});
}

export function isFunction(fn) {
  return typeof fn === 'function';
}

export function isObject(obj) {
  return typeof obj === 'object';
}

export function isString(str) {
  return typeof str === 'string';
}

export function isDefined(val) {
  return val !== undefined;
}

export function identity(val) {
  return val;
}

export function setterName(prop, prefix = 'set') {
  const Name = capitalize(prop);
  return prefix + Name;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
