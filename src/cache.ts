import { CacheInterface, keyInterface, cacheListener } from './types'
import hash from './libs/hash'

export default class Cache implements CacheInterface {
  private cache: Map<string, any>
  private listeners: cacheListener[]

  constructor(initialData: any = {}) {
    this.cache = new Map(Object.entries(initialData))
    this.listeners = []
  }

  get(key: keyInterface): any {
    const [_key] = this.serializeKey(key)
    return this.cache.get(_key)
  }

  set(key: keyInterface, value: any): any {
    const [_key] = this.serializeKey(key)
    this.cache.set(_key, value)
    this.notify()
  }

  keys() {
    return Array.from(this.cache.keys())
  }

  has(key: keyInterface) {
    const [_key] = this.serializeKey(key)
    return this.cache.has(_key)
  }

  clear() {
    this.cache.clear()
    this.notify()
  }

  delete(key: keyInterface) {
    const [_key] = this.serializeKey(key)
    this.cache.delete(_key)
    this.notify()
  }

  // TODO: introduce namespace for the cache
  serializeKey(key: keyInterface): [string, any, string, string] {
    let args = null
    if (typeof key === 'function') {
      try {
        key = key()
      } catch (err) {
        // dependencies not ready
        key = ''
      }
    }

    if (Array.isArray(key)) {
      // args array
      args = key
      key = hash(key)
    } else {
      // convert null to ''
      key = String(key || '')
    }

    const errorKey = key ? 'err@' + key : ''
    const isValidatingKey = key ? 'validating@' + key : ''

    return [key, args, errorKey, isValidatingKey]
  }

  subscribe(listener: cacheListener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    let isSubscribed = true
    this.listeners.push(listener)

    return () => {
      if (!isSubscribed) return
      isSubscribed = false
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners[index] = this.listeners[this.listeners.length - 1]
        this.listeners.length--
      }
    }
  }

  // Notify Cache subscribers about a change in the cache
  private notify() {
    for (let listener of this.listeners) {
      listener()
    }
  }
}
