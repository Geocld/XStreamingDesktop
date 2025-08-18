import Store from 'electron-store';

const store = new Store();

const STORE_KEY = 'user.streamToken';

export const saveStreamToken = (token: any) => {
  console.log('saveStreamToken:', token);
  try {
    store.set(STORE_KEY, token);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    store.set(STORE_KEY, {});
  }
};

export const getStreamToken = (): any => {
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

export const clearStreamToken = () => {
  store.set(STORE_KEY, {});
};

export const isStreamTokenValid = (token: any) => {
  if (!token) {
    return false;
  }
  const {data, _objectCreateTime} = token;
  if (!data || !data.durationInSeconds) {
    return false;
  }
  return (
    _objectCreateTime + data.durationInSeconds * 1000 - new Date().getTime() >
    60 * 1000
  );
};
