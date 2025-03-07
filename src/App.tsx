
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { RetellProvider } from "./context/RetellContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import NewAgent from "./pages/NewAgent";
import Voices from "./pages/Voices";
import LLMs from "./pages/LLMs";
import Calls from "./pages/Calls";
import NewCall from "./pages/NewCall";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <RetellProvider>
        <TooltipProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/new" element={<NewAgent />} />
              <Route path="/voices" element={<Voices />} />
              <Route path="/llms" element={<LLMs />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/calls/new" element={<NewCall />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </RetellProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
