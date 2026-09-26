import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  path: string;
  value: string;
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  onSave: () => void;
}

function CodeEditor({ path, value, editorRef, onSave }: CodeEditorProps) {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'vs-dark'
    : 'vs';

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current();
    });
  };

  return (
    <Editor
      height="100%"
      path={path}
      defaultValue={value}
      theme={theme}
      options={{ automaticLayout: true, minimap: { enabled: false } }}
      onMount={handleMount}
    />
  );
}

export default CodeEditor;
