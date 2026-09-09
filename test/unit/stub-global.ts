/**
 * Replaces globals for the duration of one test and hands back the undo.
 *
 * `Object.defineProperty(globalThis, ...)` in a `beforeEach` outlives the file
 * that wrote it: `bun test` shares one global across files unless `--isolate`
 * is passed, and three files here stubbed `localStorage` with a `getItem` that
 * always returns null. Under `--randomize` that reached the view counter's
 * own tests, which store what they have counted, and they failed on an order
 * nobody chose. The flags in `test:unit` prevent the crossing; restoring is
 * what makes a bare `bun test <file> <file>` safe too.
 */
export function stubGlobals(stubs: Record<string, unknown>): () => void {
  const originals = Object.entries(stubs).map(([name, value]) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    })
    return [name, original] as const
  })

  return () => {
    for (const [name, original] of originals) {
      if (original) {
        Object.defineProperty(globalThis, name, original)
      } else {
        Reflect.deleteProperty(globalThis, name)
      }
    }
  }
}

export function matchMediaStub(matches = false) {
  return (query: string) => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  })
}

export function localStorageStub(read: () => Record<string, string>) {
  return {
    clear: () => {
      const store = read()
      for (const key of Object.keys(store)) {
        delete store[key]
      }
    },
    getItem: (key: string) => read()[key] ?? null,
    removeItem: (key: string) => {
      delete read()[key]
    },
    setItem: (key: string, value: string) => {
      read()[key] = value
    },
  }
}
