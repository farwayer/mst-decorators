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

export function identity(val) {
  return val;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function hasKeys(obj) {
  return !!Object.keys(obj).length
}
