declare const defineTest: (
  name: string,
  def: {
    invoke: () => Promise<unknown>;
    assert: (result: unknown) => Promise<void>;
  }
) => void;

defineTest('adds two numbers', {
  invoke: async () => {
    console.log('computing sum');
    return 2 + 3;
  },
  assert: async (result) => {
    if (result !== 5) throw new Error(`expected 5, got ${result}`);
  },
});

defineTest('a test whose invoke throws', {
  invoke: async () => {
    throw new Error('boom');
  },
  assert: async () => {},
});

defineTest('a failing assertion', {
  invoke: async () => 1,
  assert: async (result) => {
    if (result !== 2) throw new Error(`expected 2, got ${result}`);
  },
});
