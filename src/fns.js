import {when} from 'rambda'
import {isFn} from 'istp'

export const whenFn = when(isFn)
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
