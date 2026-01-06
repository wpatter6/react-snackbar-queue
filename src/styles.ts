type StylesOptions = {
  animationDuration: number;
  colors: Record<string, string>;
};

export const styles = (
  prefix: string,
  { animationDuration, colors }: StylesOptions
) => `
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
`;
