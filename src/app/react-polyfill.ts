// React SSR polyfill for Amplify builds
if (typeof window === "undefined" && typeof global !== "undefined") {
  // Ensure React hooks are available during SSR
  const React = require("react");

  // Polyfill global React if it doesn't exist
  if (!global.React) {
    global.React = React;
  }

  // Ensure hooks are properly bound
  if (React.useState && !React.useState.toString().includes("[native code]")) {
    // React hooks are available, no need to polyfill
  } else {
    // Create safe fallbacks for SSR
    global.React = {
      ...React,
      useState: (initial: any) => [initial, () => {}],
      useRef: (initial: any) => ({ current: initial }),
      useEffect: () => {},
      useCallback: (fn: any) => fn,
      useMemo: (fn: any) => fn(),
    };
  }
}
