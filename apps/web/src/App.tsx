import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Explore from "./pages/Explore";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Community from "./pages/Community";
import CreateCommunity from "./pages/CreateCommunity";
import EditCommunity from "./pages/EditCommunity";
import CreateEvent from "./pages/CreateEvent";
import You from "./pages/You";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/communities/new" element={<CreateCommunity />} />
      <Route path="/communities/:id/edit" element={<EditCommunity />} />
      <Route path="/communities/:id/events/new" element={<CreateEvent />} />
      <Route path="/communities/:id" element={<Community />} />
      <Route path="/you" element={<You />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
