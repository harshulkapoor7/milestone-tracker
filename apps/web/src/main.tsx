import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import "./index.css";

// One cache for all server data. Components ask it for data; it fetches,
// caches, de-duplicates and refetches for them.
const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) throw new Error("No #root element in index.html");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
