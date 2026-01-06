import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// #region Types
type SnackbarSeverity = "default" | "success" | "error" | "info" | "warning";

type SnackbarPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";

type EnqueueSnackbarOptions = {
  severity?: SnackbarSeverity;
  duration?: number;
  onClose?: () => void;
  buttons?: ReactNode[];
  noCloseButton?: boolean;
};

type SnackbarContextType = {
  // Add snackbar to the queue, returns the snackbar ID
  enqueueSnackbar: EnqueueSnackbarType;
  // Hide snackbar programmatically/early by ID
  hideSnackbar: (id: number) => Promise<void>; // made optional for default context
};

type EnqueueSnackbarType = (
  message: ReactNode,
  options?: EnqueueSnackbarOptions
) => number;

type SnackbarObject = {
  id: number;
  message: ReactNode;
} & EnqueueSnackbarOptions;
// #endregion

// #region Context
const DEFAULT_SNACKBAR_CONTEXT = {
  enqueueSnackbar: () => -1,
  hideSnackbar: async () => {},
};
const SnackbarContext = createContext<SnackbarContextType>(
  DEFAULT_SNACKBAR_CONTEXT
);
export const useSnackbar = () => useContext(SnackbarContext);
// #endregion

// #region Defaults and constants
const DEFAULT_SNACKBAR_DURATION = 5000;
const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_MAX_SNACKBARS = 2;
const DEFAULT_POSITION = "bottom-center";
const DEFAULT_SNACKBAR_COLORS: Record<SnackbarSeverity, string> = {
  default: "#333",
  success: "#3e8d40",
  error: "#f44336",
  info: "#2196f3",
  warning: "#b96f00",
};

const SNACKBAR_POSITION_CLASSES: Record<SnackbarPosition, string> = {
  "top-left": "top-4 left-4 items-start",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "top-center": "top-4 left-1/2 transform -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2 items-center",
};

const SNACKBAR_POSITION_TRANSLATE_CLASSES: Record<SnackbarPosition, string> = {
  "top-left": "-translate-x-480 translate-y-0",
  "top-right": "translate-x-480 translate-y-0",
  "bottom-left": "-translate-x-480 translate-y-0",
  "bottom-right": "translate-x-480 translate-y-0",
  "top-center": "translate-x-0 -translate-y-480",
  "bottom-center": "translate-x-0 translate-y-480",
};

const DEFAULT_CLOSE_ICON_SVG = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  </svg>
);
// #endregion

// #region Snackbar Item Component
type SnackbarItemProps = {
  message: ReactNode;
  hide: boolean;
  onClose: () => void;
  severity?: SnackbarSeverity;
  index: number;
  className?: string;
  colors?: Partial<Record<SnackbarSeverity, string>>;
  buttons?: ReactNode[];
  noCloseButton?: boolean;
  closeIcon?: ReactNode;
  animationDuration?: number;
  position?: SnackbarPosition;
};

function SnackbarItem({
  message,
  onClose,
  hide,
  index,
  className,
  colors,
  severity,
  animationDuration,
  closeIcon,
  buttons,
  noCloseButton,
  position,
}: SnackbarItemProps) {
  const [isInit, setIsInit] = useState(false);
  const classes = [
    className,
    "cursor-default",
    "text-white",
    "p-4",
    "rounded-md",
    "flex",
    "justify-between",
    "items-center",
    "w-96",
    "max-w-full",
    "shadow-lg",
    "pointer-events-auto",
    "transition-transform",
    `duration-${animationDuration ?? DEFAULT_ANIMATION_DURATION}`,
    hide || !isInit
      ? SNACKBAR_POSITION_TRANSLATE_CLASSES[position ?? DEFAULT_POSITION]
      : `translate-0`,
    `z-index-${100 + index}`,
  ].filter(Boolean) as string[];

  const styleMemo = useMemo(
    () => ({
      backgroundColor:
        colors?.[severity ?? "default"] ??
        DEFAULT_SNACKBAR_COLORS[severity ?? "default"],
      animationDuration: `${animationDuration ?? DEFAULT_ANIMATION_DURATION}ms`,
    }),
    [colors, severity, animationDuration]
  );

  useEffect(() => {
    // Trigger initial animation
    setIsInit(true);
  }, []);

  return (
    <div className={classes.join(" ")} style={styleMemo}>
      <span
        // aria hidden to avoid screen reader repetition - we use a live region for all messages below
        aria-hidden="true"
      >
        {message}
      </span>
      <div className="ml-4 flex gap-3">
        {buttons}
        {!noCloseButton && <button onClick={onClose}>{closeIcon}</button>}
      </div>
    </div>
  );
}
// #endregion

// #region Snackbar Provider Component
type SnackbarProviderProps = {
  children: ReactNode | ReactNode[];
  colors?: Partial<Record<SnackbarSeverity, string>>;
  classes?: Partial<Record<"container" | "snackbar", string>>;
  animationDuration?: number;
  snackbarDuration?: number;
  noCloseButton?: boolean;
  closeIcon?: ReactNode;
  position?: SnackbarPosition;
  maxSnackbars?: number;
};

export function SnackbarProvider({
  children,
  colors,
  classes,
  noCloseButton = false,
  closeIcon = DEFAULT_CLOSE_ICON_SVG,
  snackbarDuration = DEFAULT_SNACKBAR_DURATION,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  maxSnackbars = DEFAULT_MAX_SNACKBARS,
  position = DEFAULT_POSITION,
}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<Array<SnackbarObject>>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  const providerValue = useMemo<SnackbarContextType>(() => {
    const hideSnackbar = async (id: number, sb?: SnackbarObject) => {
      if (hiddenIds.has(id)) return; // already hiding

      const snackbar = sb ?? snackbars.find((s) => s.id === id);
      if (!snackbar || snackbar.id !== id) return; // invalid id or sb passed

      setHiddenIds((prev) => new Set(prev).add(id));

      // wait for animation to remove, -1 to prevent flashing
      await new Promise((resolve) =>
        setTimeout(resolve, animationDuration - 1)
      );

      setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
      snackbar.onClose?.(); // call onClose callback if provided, AFTER animation
      setTimeout(() => {
        // prevent hiddenIds infinite growth
        setHiddenIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2);
    };
    return {
      enqueueSnackbar: (message, options) => {
        const id = Date.now();
        const sb: SnackbarObject = {
          ...options,
          id,
          message,
        };
        setSnackbars((prev) => [...prev.slice(-maxSnackbars + 1), sb]);
        setTimeout(() => {
          // must pass the sb object because hideSnackbar function is stale in this closure
          hideSnackbar(id, sb);
        }, options?.duration || snackbarDuration || DEFAULT_SNACKBAR_DURATION);
        return id;
      },
      hideSnackbar,
    };
  }, [hiddenIds, snackbars, maxSnackbars, snackbarDuration]);

  return (
    <SnackbarContext.Provider value={providerValue}>
      {children}
      <div
        className={
          (classes?.container ||
            `fixed flex flex-col gap-2 z-50 h-auto min-h-24 pointer-events-none `) +
          SNACKBAR_POSITION_CLASSES[position]
        }
      >
        {snackbars.map((snackbar, index) => (
          <SnackbarItem
            key={snackbar.id}
            index={index}
            message={snackbar.message}
            severity={snackbar.severity}
            hide={hiddenIds.has(snackbar.id)}
            onClose={() => providerValue.hideSnackbar(snackbar.id)}
            className={classes?.snackbar}
            colors={colors}
            animationDuration={animationDuration}
            buttons={snackbar.buttons}
            noCloseButton={noCloseButton || snackbar.noCloseButton}
            closeIcon={closeIcon}
            position={position}
          />
        ))}
      </div>
      {/* Announce latest message to screen readers */}
      <div className="invisible h-0 w-0 overflow-hidden" aria-live="polite">
        {snackbars[0]?.message || ""}
      </div>
    </SnackbarContext.Provider>
  );
}
// #endregion
