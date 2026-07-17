import { createRoot } from "react-dom/client";
import { QueryProvider } from "./providers/query-provider";
import { AppRouter } from "./routes/app-router";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AppRouter />
  </QueryProvider>,
);
