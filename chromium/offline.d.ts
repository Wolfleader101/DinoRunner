export interface IObstacleType {
  type: string;
  width: number;
  height: number;
  yPos: number;
  multipleSpeed: number;
  minGap: number;
  minSpeed: number;
}

export interface IObstacle {
  typeConfig: IObstacleType;
  gapCoefficient: number;
  size: number;
  //   dimensions = dimensions;
  xPos: number;
  yPos: number;
  width: number;
  //   collisionBoxes = [];
  gap: number;
  speedOffset: number;
}

export interface IRunner {
  instance_: IRunner;

  outerContainerEl: string;
  containerEl: string | null;
  snackbarEl: string | null;

  config: object;
  // Logical dimensions of the container.
  dimensions: {
    WIDTH: number;
    HEIGHT: number;
  };

  gameType: any;

  distanceRan: number;

  highestScore: number;

  time: number;
  runningTime: number;
  msPerFrame: number;
  currentSpeed: number;

  obstacles: IObstacle[];

  activated: boolean; // Whether the easter egg has been activated.
  playing: boolean; // Whether the game is currently in play state.
  crashed: boolean;

  playCount: number;
}
