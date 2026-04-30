import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Explore from "./pages/Explore";
import Auth from "./pages/Auth";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/communities/:id" element={<Community />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
