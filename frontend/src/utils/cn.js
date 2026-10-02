// Join class names, skipping falsy values:  cn("a", isOn && "b")  →  "a b"
export const cn = (...classes) => classes.filter(Boolean).join(" ");
