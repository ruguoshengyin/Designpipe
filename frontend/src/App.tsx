import { Routes, Route, Navigate } from "react-router-dom";
import HomeView from "./views/HomeView";
import ProjectView from "./views/ProjectView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/project/:id" element={<ProjectView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
