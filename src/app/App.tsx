import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import { Preloader } from '../shared/components/ui/Preloader';

export function App() {
  return (
    <AppProviders>
      {/* Quick, elegant preloader on initial application boot */}
      <Preloader />
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
