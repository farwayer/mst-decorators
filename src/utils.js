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

export function isFunction(fn) {
  return typeof fn === 'function';
}

export function isObject(o) {
  return typeof o === 'object';
}

export function isString(s) {
  return typeof s === 'string';
}

export function identity(val) {
  return val;
}
