import test from 'blue-tape'

import * as index from '../src/index'

test('index', async t => {
  t.doesNotThrow(() => index.noop())
})
