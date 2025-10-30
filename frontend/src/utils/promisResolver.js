export const promiseResolver = async (promise) => {
  try {
    // Await the promise and return the result
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error];
  }
};
