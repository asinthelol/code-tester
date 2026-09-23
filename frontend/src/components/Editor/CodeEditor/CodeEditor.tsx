import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  path: string;
  value: string;
}

function CodeEditor({ path, value }: CodeEditorProps) {
  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'vs-dark'
    : 'vs';

  return (
    <Editor
      height="60svh"
      path={path}
      defaultValue={value}
      theme={theme}
      options={{ automaticLayout: true, minimap: { enabled: false } }}
    />
  );
}

export default CodeEditor;
