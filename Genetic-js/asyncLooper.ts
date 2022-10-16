export async function asyncLooper(
  shouldContinue: (currIteration: number) => boolean,
  doStuff: (currIteration: number, breakFn: Function) => any
) {
  let currIteration = 0;
  let didBreak = false;
  const breakFn = () => (didBreak = true);
  const wrapper = (): Promise<any> => {
    try {
      return Promise.resolve(doStuff(currIteration, breakFn)).then(() => {
        try {
          const willContinue = !didBreak && shouldContinue(currIteration);
          if (willContinue) {
            currIteration++;
            return Promise.resolve(wrapper());
          }
        } catch (error) {
          return Promise.reject(error);
        }
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };
  try {
    return Promise.resolve(wrapper());
  } catch (error) {
    return Promise.reject(error);
  }
}
