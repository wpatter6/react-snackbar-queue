import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// #region Types
export type SnackbarSeverity =
  | "default"
  | "success"
  | "error"
  | "info"
  | "warning";

export type SnackbarPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";

export type EnqueueSnackbarOptions = {
  severity?: SnackbarSeverity;
  duration?: number;
  onClose?: () => void;
  buttons?: ReactNode[];
  noCloseButton?: boolean;
};

export type SnackbarContextType = {
  // Add snackbar to the queue, returns the snackbar ID
  enqueueSnackbar: EnqueueSnackbarType;
  // Hide snackbar programmatically/early by ID
  hideSnackbar: (id: number) => Promise<void>; // made optional for default context
};

export type EnqueueSnackbarType = (
  message: ReactNode,
  options?: EnqueueSnackbarOptions
) => number;

export type SnackbarObject = {
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
const CLASS_PREFIX = "rtsq-aoz89d";
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

const SNACKBAR_POSITION_TRANSLATE_VALUES: Record<
  SnackbarPosition,
  Record<"translateX" | "translateY", string>
> = {
  "top-left": { translateX: "-480px", translateY: "0px" },
  "top-right": { translateX: "480px", translateY: "0px" },
  "bottom-left": { translateX: "-480px", translateY: "0px" },
  "bottom-right": { translateX: "480px", translateY: "0px" },
  "top-center": { translateX: "0px", translateY: "-480px" },
  "bottom-center": { translateX: "0px", translateY: "480px" },
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
  severity,
  animationDuration,
  closeIcon,
  buttons,
  noCloseButton,
  position,
}: SnackbarItemProps) {
  const [isInit, setIsInit] = useState(false);
  const classes = [
    `${CLASS_PREFIX}-i`,
    `${CLASS_PREFIX}-i-${severity ?? "default"}`,
    className,
  ].filter(Boolean) as string[];

  const styleMemo = useMemo(
    () => ({
      zIndex: 100 + index,
      ...(hide || !isInit
        ? {
            transform: `translate(${
              SNACKBAR_POSITION_TRANSLATE_VALUES[position ?? DEFAULT_POSITION]
                .translateX
            }, ${
              SNACKBAR_POSITION_TRANSLATE_VALUES[position ?? DEFAULT_POSITION]
                .translateY
            })`,
          }
        : {
            transform: `translate(0px, 0px)`,
          }),
    }),
    [severity, animationDuration, isInit, hide, index, position]
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
      <div className={`${CLASS_PREFIX}-i-buttons`}>
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

  useEffect(() => {
    const id = `${CLASS_PREFIX}-style`;
    const existing = document.getElementById(id);
    if (existing) {
      // remove existing to update
      existing.remove();
    }
    const styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.innerHTML = styles(CLASS_PREFIX, {
      animationDuration: animationDuration || DEFAULT_ANIMATION_DURATION,
      colors: { ...DEFAULT_SNACKBAR_COLORS, ...colors },
    });
    document.head.prepend(styleEl);
  }, [animationDuration, colors]);

  return (
    <SnackbarContext.Provider value={providerValue}>
      {children}
      <div
        className={[
          `${CLASS_PREFIX}-c-${position}`,
          `${CLASS_PREFIX}-c`,
          classes?.container || "",
        ]
          .join(" ")
          .trim()}
        aria-hidden="true"
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
            animationDuration={animationDuration}
            buttons={snackbar.buttons}
            noCloseButton={noCloseButton || snackbar.noCloseButton}
            closeIcon={closeIcon}
            position={position}
          />
        ))}
      </div>
      {/* Announce latest message to screen readers */}
      <div className={`${CLASS_PREFIX}-aria`} aria-live="polite">
        {snackbars[0]?.message || ""}
      </div>
    </SnackbarContext.Provider>
  );
}
// #endregion

// #region Styles
type StylesOptions = {
  animationDuration: number;
  colors: Record<string, string>;
};

const styles = (prefix: string, { animationDuration, colors }: StylesOptions) =>
  `
  .${prefix}-c {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 50;
    height: auto;
    min-height: 6rem;
    pointer-events: none;
  }
  .${prefix}-c-top-left {
    top: 1rem;
    left: 1rem;
    align-items: flex-start;
  }
  
  .${prefix}-c-top-right {
    top: 1rem;
    right: 1rem;
    align-items: flex-end;
  }
  .${prefix}-c-bottom-left {
    bottom: 1rem;
    left: 1rem;
    align-items: flex-start;
  }
  .${prefix}-c-bottom-right {
    bottom: 1rem;
    right: 1rem;
    align-items: flex-end;
  }
  .${prefix}-c-top-center {
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }
  .${prefix}-c-bottom-center {
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }
  .${prefix}-i {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 24rem;
    max-width: 100%;
    padding: 1rem;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    pointer-events: auto;
    transition-property: transform;
    cursor: default;
    color: white;
    transition-duration: ${animationDuration}ms;
  }
  .${prefix}-i-buttons {
    margin-left: 1rem;
    display: flex;
    gap: 0.75rem;
  }
  .${prefix}-aria {
    visibility: hidden;
    height: 0;
    width: 0;
    overflow: hidden;
  }
  ${Object.entries(colors)
    .map(
      ([key, value]) => `
    .${prefix}-i-${key} {
      background-color: ${value};
    }
  `
    )
    .join("")}
`
    .replace(/\s/g, "")
    .replace(/\n/g, "");
// #endregion
