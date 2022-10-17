export async function asyncLooper(
  shouldContinue: (currIteration: number) => boolean,
  doStuff: (currIteration: number, breakFn: Function) => any
) {
  let currIteration = 0;
  let didBreak = false;
  const breakFn = () => (didBreak = true);
  const wrapper = async (): Promise<any> => {
    try {
      let doStuffRun = await doStuff(currIteration, breakFn);

      // return Promise.resolve(await doStuff(currIteration, breakFn)).then(() => {
      try {
        const willContinue = !didBreak && shouldContinue(currIteration);
        if (willContinue) {
          currIteration++;
          return await wrapper();
        }
      } catch (error) {
        return Promise.reject(error);
      }
      // });
    } catch (error) {
      return Promise.reject(error);
    }
  };
  try {
    return await wrapper();
  } catch (error) {
    return Promise.reject(error);
  }
}
