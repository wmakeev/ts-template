import type { Reference } from './Reference'

export function getReferenceStr(ref: string | Reference) {
  if (typeof ref === 'string') {
    return ref
  } else if (typeof ref.self === 'string') {
    return ref.self
  } else {
    throw new TypeError('Incorrect reference argument')
  }
}

export function dateToString(date: Date | undefined) {
  if (!date) return undefined

  const dateTmp = new Date(date)

  dateTmp.setMilliseconds(0)

  return dateTmp.toJSON()
}

export function omitField<T extends Object, U extends keyof T>(
  obj: T,
  field: U
) {
  const tmp = Object.assign({}, obj)

  delete tmp[field]

  return tmp as Omit<T, U>
}

const URI_EXTRA_SLASH_REGEX = /([^:]\/)\/+/g
const TRIM_SLASH = /^\/+|\/+$/g

export function normalizeUrl(url: string) {
  return url.replace(TRIM_SLASH, '').replace(URI_EXTRA_SLASH_REGEX, '$1')
}

export function pathJoin(...args: string[]) {
  return normalizeUrl(args.join('/'))
}
