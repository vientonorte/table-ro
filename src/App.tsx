import { BoardProvider } from './contexts/BoardContext';
import { BujoProvider } from './contexts/BujoContext';
import { CalProvider } from './contexts/CalContext';
import { AIProvider } from './contexts/AIContext';
import TableroRo from './pages/TableroRo';

export default function App() {
  return (
    <AIProvider>
      <CalProvider>
        <BoardProvider>
          <BujoProvider>
            <a href="#wboard" className="vn-skip-link">Saltar al tablero</a>
            <TableroRo />
          </BujoProvider>
        </BoardProvider>
      </CalProvider>
    </AIProvider>
  );
}
