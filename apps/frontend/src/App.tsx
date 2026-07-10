import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TimelinePage } from './pages/TimelinePage';
import { MapPage } from './pages/MapPage';
import { BattlesPage } from './pages/BattlesPage';
import { BattleDetailPage } from './pages/BattleDetailPage';
import { PeoplePage } from './pages/PeoplePage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { StatsPage } from './pages/StatsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/batallas" element={<BattlesPage />} />
        <Route path="/batallas/:id" element={<BattleDetailPage />} />
        <Route path="/personas" element={<PeoplePage />} />
        <Route path="/personas/:id" element={<PersonDetailPage />} />
        <Route path="/campanas" element={<CampaignsPage />} />
        <Route path="/estadisticas" element={<StatsPage />} />
      </Route>
    </Routes>
  );
}
