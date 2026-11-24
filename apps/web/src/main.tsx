import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { App } from "./App";
import { ApiError } from "./lib/api";
import { keys } from "./lib/queries";
import "./index.css";

// One cache for all server data. Components ask it for data; it fetches,
// caches, de-duplicates and refetches for them.
//
// If ANY request comes back 401 (e.g. the session expired while the tab was
// open), forget the user: the app shows the login screen instead of errors.
const onError = (err: Error) => {
  if (err instanceof ApiError && err.status === 401) {
    queryClient.setQueryData(keys.me, null);
  }
};
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
});

const root = document.getElementById("root");
if (!root) throw new Error("No #root element in index.html");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
