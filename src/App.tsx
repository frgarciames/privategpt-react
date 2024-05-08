import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';

import { ChatPage } from './pages/chat';
import { PromptPage } from './pages/prompt';
import { RootPage } from './pages/root';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootPage />,
    children: [
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'prompt',
        element: <PromptPage />,
      },
    ],
  },
];

function App() {
  return <RouterProvider router={createBrowserRouter(routes)} />;
}

export default App;
