function isType(type) {
  return val => typeof val === type
}

export const fn = isType('function')
export const str = isType('string')
export const obj = isType('object')
export const def = val => val !== undefined
export const nul = val => val === null
export const int = val => Number.isInteger(val)
export function gen(obj) {
  if (!obj) return false

  const {constructor} = obj
  if (!constructor) return false
  if (
    'GeneratorFunction' === constructor.name ||
    'GeneratorFunction' === constructor.displayName
  ) return true

  const {prototype} = constructor
  return fn(prototype.next) && fn(prototype.throw)
}
