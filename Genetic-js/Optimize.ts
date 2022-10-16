export type OptimizeFun = (fitnessA: number, fitnessB: number) => boolean;

export const Maximize: OptimizeFun = (first: number, second: number) => {
  return first >= second;
};

export const Minimize: OptimizeFun = (first: number, second: number) => {
  return first < second;
};
