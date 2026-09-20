import React from "react";

const WIDTHS = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

/**
 * Standard page frame: same max width, padding and heading treatment on every
 * screen. Pages previously each invented their own container, which is why
 * titles jumped around in size and alignment between routes.
 */
export default function PageShell({
  title,
  description,
  actions,
  width = "md",
  children,
}) {
  return (
    <div className={`mx-auto w-full ${WIDTHS[width] || WIDTHS.md} px-4 py-8 sm:py-10`}>
      {(title || actions) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-black sm:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-none gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
