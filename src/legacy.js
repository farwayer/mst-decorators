import {reduce} from 'rambda'

export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || (
  obj => {
    const props = Object.getOwnPropertyNames(obj)

    return reduce((descs, prop) => {
      descs[prop] = Object.getOwnPropertyDescriptor(obj, prop)
      return descs
    }, {}, props)
  }
)
