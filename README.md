# react-snackbar-queue

#### A zero-dependency, fully configurable Snackbar queue provider using React, written in Typescript

[![NPM](https://nodei.co/npm/react-snackbar-queue.svg)](https://www.npmjs.com/package/react-snackbar-queue/)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
[![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

### [Code Sandbox Demo](https://codesandbox.io/p/sandbox/kswkj5)

---

## Get started:

Install:

```bash
npm i react-snackbar-queue
```

In your app.tsx (or wherever your context providers are added)

```tsx
<SnackbarProvider>{/* your app */}</SnackbarProvider>
```

And then within any components, you can use it like so:

```tsx
export default function MyComponent() {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <button
      onClick={() => enqueueSnackbar("Hello world", { variant: "success" })}
    >
      Show Snackbar
    </button>
  );
}
```

---

## Configuration

There are various options that can be passed as the second parameter to the `enqueueSnackbar` function to affect the individual snackbar functionality. This options object is defined below:

```ts
type EnqueueSnackbarOptions = {
  severity?: SnackbarSeverity; // "default" | "success" | "error" | "info" | "warning"
  duration?: number; // How long to show the snackbar before auto-closing. Default is 5000 (5 secs)
  onClose?: () => void; // Triggered after close and exit animation
  buttons?: ReactNode[]; // Any number of elements to be included in the snackbar (ex: "Undo" button)
  noCloseButton?: boolean; // Don't allow "X" close button
};
```

The `SnackbarProvider` will also accept global settings that will affect all snackbars.
The props for this component are defined below:

```ts
type SnackbarProviderProps = {
  children: ReactNode | ReactNode[];
  colors?: Partial<Record<SnackbarSeverity, string>>; // Override default colors for severities
  classes?: Partial<Record<"container" | "snackbar", string>>; // Add classes to either the container element, or each snackbar
  animationDuration?: number; // Animate in duration in milliseconds. Default is 300
  snackbarDuration?: number; // How long to show ALL snackbars before auto-closing. Default is 5000 (5 secs)
  noCloseButton?: boolean; // Don't allow "X" close button on ALL snackbars
  closeIcon?: ReactNode; // Replace the close icon
  position?: SnackbarPosition; // Placement for all snackbars
  maxSnackbars?: number; // How many to show at once in the queue. Default is 2
};
```

Values for Severity & Position are defined below:

```ts
type SnackbarSeverity = "default" | "success" | "error" | "info" | "warning";

type SnackbarPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";
```

---

## Advanced usage:

Snackbars can also be hidden programmatically. The `useSnackbar` hook also returns a `hideSnackbar` function. The `enqueueSnackbar` function returns the ID for the snackbar that was shown which can be passed into the `hideSnackbar` function to hide it programmatically.

---

## Publishing

set url in .npmrc
