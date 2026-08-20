let runtimeAuthToken = null;

export const setRuntimeAuthToken = (token) => {
  runtimeAuthToken = typeof token === 'string' ? token : null;
};

export const getRuntimeAuthToken = () => runtimeAuthToken;

export const clearRuntimeAuthToken = () => {
  runtimeAuthToken = null;
};
