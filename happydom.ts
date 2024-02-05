import { mock } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

mock.module('next/image', () => {
  return {
    default: 'img',
  }
})
