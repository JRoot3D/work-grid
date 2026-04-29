import { Provider } from 'react-redux';
import { store } from './app/store';
import { BoardPage } from './features/board/components/BoardPage';

export function App() {
  return (
    <Provider store={store}>
      <BoardPage />
    </Provider>
  );
}
