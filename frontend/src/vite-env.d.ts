/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'highlight.js' {
  const hljs: {
    highlight: (code: string, options: { language: string; ignoreIllegals?: boolean }) => { value: string };
    highlightAuto: (code: string) => { value: string };
    getLanguage: (name: string) => unknown;
  };
  export default hljs;
}
