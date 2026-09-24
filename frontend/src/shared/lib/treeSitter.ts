import Parser from 'web-tree-sitter';
import type { FunctionInfo } from './types';

const JS_QUERY = `
  (function_declaration name: (identifier) @name) @func
  (variable_declarator name: (identifier) @name value: (arrow_function)) @func
  (variable_declarator name: (identifier) @name value: (function_expression)) @func
  (method_definition name: (property_identifier) @name) @func
`;

interface LanguageConfig {
  wasm: string;
  query: string;
}

const LANGUAGES: Record<string, LanguageConfig> = {
  js: { wasm: 'tree-sitter-javascript.wasm', query: JS_QUERY },
  jsx: { wasm: 'tree-sitter-javascript.wasm', query: JS_QUERY },
  ts: { wasm: 'tree-sitter-typescript.wasm', query: JS_QUERY },
  tsx: { wasm: 'tree-sitter-tsx.wasm', query: JS_QUERY },
  py: {
    wasm: 'tree-sitter-python.wasm',
    query: `(function_definition name: (identifier) @name) @func`,
  },
  go: {
    wasm: 'tree-sitter-go.wasm',
    query: `
      (function_declaration name: (identifier) @name) @func
      (method_declaration name: (field_identifier) @name) @func
    `,
  },
  rs: {
    wasm: 'tree-sitter-rust.wasm',
    query: `(function_item name: (identifier) @name) @func`,
  },
  java: {
    wasm: 'tree-sitter-java.wasm',
    query: `(method_declaration name: (identifier) @name) @func`,
  },
  c: {
    wasm: 'tree-sitter-c.wasm',
    query: `(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func`,
  },
  h: {
    wasm: 'tree-sitter-c.wasm',
    query: `(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func`,
  },
  cpp: {
    wasm: 'tree-sitter-cpp.wasm',
    query: `(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func`,
  },
  hpp: {
    wasm: 'tree-sitter-cpp.wasm',
    query: `(function_definition declarator: (function_declarator declarator: (identifier) @name)) @func`,
  },
  cs: {
    wasm: 'tree-sitter-c_sharp.wasm',
    query: `(method_declaration name: (identifier) @name) @func`,
  },
  rb: {
    wasm: 'tree-sitter-ruby.wasm',
    query: `(method name: (identifier) @name) @func`,
  },
  php: {
    wasm: 'tree-sitter-php.wasm',
    query: `
      (function_definition name: (name) @name) @func
      (method_declaration name: (name) @name) @func
    `,
  },
};

let initPromise: Promise<void> | null = null;

function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = Parser.init({
      locateFile: (file: string) => `/tree-sitter/${file}`,
    });
  }
  return initPromise;
}

const languageCache = new Map<string, Promise<Parser.Language>>();

function loadLanguage(wasm: string): Promise<Parser.Language> {
  let promise = languageCache.get(wasm);
  if (!promise) {
    promise = Parser.Language.load(`/tree-sitter/${wasm}`);
    languageCache.set(wasm, promise);
  }
  return promise;
}

function getExtension(filePath: string): string {
  const match = /\.([^./\\]+)$/.exec(filePath);
  return match ? match[1].toLowerCase() : '';
}

export function isParsable(filePath: string): boolean {
  return getExtension(filePath) in LANGUAGES;
}

export async function extractFunctions(
  filePath: string,
  content: string
): Promise<FunctionInfo[]> {
  const config = LANGUAGES[getExtension(filePath)];
  if (!config) return [];

  await ensureInit();
  const language = await loadLanguage(config.wasm);

  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(content);
  if (!tree) return [];

  const query = language.query(config.query);
  const matches = query.matches(tree.rootNode);

  const functions: FunctionInfo[] = [];
  for (const match of matches) {
    const funcCapture = match.captures.find((c) => c.name === 'func');
    const nameCapture = match.captures.find((c) => c.name === 'name');
    if (!funcCapture || !nameCapture) continue;

    functions.push({
      name: nameCapture.node.text,
      filePath,
      startLine: funcCapture.node.startPosition.row + 1,
      endLine: funcCapture.node.endPosition.row + 1,
    });
  }

  return functions;
}
