// ============================================================
// App Root — Routes & Global State
// ============================================================
// The year is lifted to app level so all pages share the same
// year context. The Layout passes it down via Outlet context.
// ============================================================

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MonthlyEntry from "./pages/DailyEntry";
import Summary from "./pages/Summary";
import { CURRENT_YEAR } from "./lib/constants";

export default function App() {
  const [year, setYear] = useState(CURRENT_YEAR);

  return (
    <Router>
      <Routes>
        <Route element={<Layout year={year} onYearChange={setYear} />}>
          <Route index element={<Dashboard year={year} />} />
          <Route path="monthly" element={<MonthlyEntry year={year} />} />
          <Route path="summary" element={<Summary year={year} />} />
        </Route>
      </Routes>
    </Router>
  );
}