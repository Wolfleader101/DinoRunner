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
  //   dimensions : dimensions;
  xPos: number;
  yPos: number;
  width: number;
  //   collisionBoxes : [];
  gap: number;
  speedOffset: number;
}

export interface ITrex {
  xPos: number;
  yPos: number;
  xInitialPos: number;
  // Position when on the ground.
  groundYPos: number;
  currentFrame: number;
  timer: number;
  msPerFrame: number;
  //   config : Object.assign(Trex.config, Trex.normalJumpConfig);
  // Current status.
  status: {
    CRASHED: "CRASHED";
    DUCKING: "DUCKING";
    JUMPING: "JUMPING";
    RUNNING: "RUNNING";
    WAITING: "WAITING";
  };
  jumping: boolean;
  ducking: boolean;
  jumpVelocity: number;
  reachedMinHeight: boolean;
  speedDrop: boolean;
  jumpCount: number;
  jumpspotX: number;
  flashing: boolean;

  startJump(speed: number): void;
}
export interface IRunner {
  instance_: IRunner;

  tRex: ITrex;

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

  startGame(): void;
  playIntro(): void;
  restart(): void;
}
