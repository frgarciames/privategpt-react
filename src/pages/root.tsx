import { Outlet, useNavigate } from 'react-router-dom';

import { checkIsPgptHealthy } from '@/lib/pgpt';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export const RootPage = () => {
  const navigate = useNavigate();
  const [environment, setEnvironment] = useLocalStorage<string | undefined>(
    'pgpt-url',
    undefined,
  );

  useEffect(() => {
    if (!environment) {
      const url = prompt(
        'Please enter the URL of your Private GPT instance',
        'http://localhost:8001',
      );
      if (!url) return;
      checkIsPgptHealthy(url).then((isHealthy) => {
        if (isHealthy) {
          setEnvironment(url);
        } else {
          alert('The provided URL is not a healthy Private GPT instance');
        }
      });
    }
    navigate('/chat');
  }, []);
  if (environment) return <Outlet />;
  return <div>Loading...</div>;
};
