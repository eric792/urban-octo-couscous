"use client";

import { createContext } from "react";

/** Lets SubmitButton show a spinner for forms submitted via startTransition (see ActionForm). */
export const PendingContext = createContext(false);
