import { BrowserRouter, Route, Routes } from "react-router";
import LandingPage from "@/pages/LandingPage";
import ProjectsPage from "@/pages/ProjectsPage";
import EditorPage from "@/pages/EditorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
