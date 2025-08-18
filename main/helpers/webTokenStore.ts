import Store from 'electron-store';

const store = new Store();

const STORE_KEY = 'user.webToken';

export const saveWebToken = (token: any) => {
  console.log('saveStreamToken:', token);
  try {
    store.set(STORE_KEY, token);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    store.set(STORE_KEY, {});
  }
};

export const getWebToken = (): any => {
  try {
    const token = store.get(STORE_KEY);
    if (!token) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

export const clearWebToken = () => {
  store.set(STORE_KEY, {});
};

const calculateSecondsLeft = (date: any) => {
  const expiresOn = date;
  const currentDate = new Date();
  return Math.floor((expiresOn.getTime() - currentDate.getTime()) / 1000);
};

export const isWebTokenValid = (token: any) => {
  if (!token || !token.data || !token.data.NotAfter) {
    return false;
  }
  if (calculateSecondsLeft(new Date(token.data.NotAfter)) <= 0) {
    return false;
  }

  return true;
};
