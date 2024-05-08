import { Outlet, useNavigate } from 'react-router-dom';

import { checkIsPgptHealthy } from '@/lib/pgpt';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export const RootPage = () => {
  const navigate = useNavigate();
  const [environment, , deleteEnvironment] = useLocalStorage<
    string | undefined
  >('pgpt-url', undefined);

  useEffect(() => {
    if (!environment) {
      const url = prompt(
        'Please enter the URL of your Private GPT instance',
        'http://localhost:8001',
      );
      if (!url) return;
    }
  }, [environment]);

  useEffect(() => {
    if (!environment) return;
    checkIsPgptHealthy(environment)
      .then((isHealthy) => {
        if (!isHealthy) {
          alert('The Private GPT instance is not healthy');
          return deleteEnvironment();
        }
        navigate('/chat');
      })
      .catch(() => {
        alert('The Private GPT instance is not healthy');
        deleteEnvironment();
      });
  }, [environment]);

  if (environment) return <Outlet />;
  return <div>Loading...</div>;
};
