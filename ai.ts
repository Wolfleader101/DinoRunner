import { IRunner } from "./chromium/offline.d";
import {
  Genetic,
  GeneticState,
  Select1,
  Select2,
  Stats,
  Configuration,
} from "./genetic-js";
import { Population } from "./genetic-js/Selection";

type Entity = {
  jumpDists: number[];
  runner: IRunner;
};

type UserData = {
  solution: number;
};

type JumpInputs = {
  speed: number;
  maxSpeed: number;
  distance: number;
  width: number;
  height: number;
  altitude: number;
};

declare global {
  interface Window {
    Runner: IRunner;
  }
}

const HIGH_SCORE = 10000;
const DIST_COEFFICIENT = 0.025;
const N_MIN = 20,
  N_MAX = 175;
const M_MIN = 50,
  M_MAX = 225;
const F_MIN = 75,
  F_MAX = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const randRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

class CustomGenetic extends Genetic<Entity, UserData> {
  protected async seed(): Promise<Entity> {
    const wRunner: IRunner = window.Runner;
    var runner = wRunner.instance_;

    const shouldJumpDists = [
      randRange(N_MIN, N_MAX), // starting speed (50% of max)
      randRange(M_MIN, M_MAX), // medium speed (75% of max)
      randRange(F_MIN, F_MAX), // fast speed (90% of max)
    ];

    console.log(`Generating Random Seed: ${shouldJumpDists}`);

    return {
      jumpDists: shouldJumpDists,
      runner: runner,
    };
  }
  protected mutate(entity: Entity): Entity {
    console.log("MUTATE");
    entity.jumpDists[0] =
      Math.floor(Math.random() * 3) > 2
        ? randRange(N_MIN, N_MAX)
        : entity.jumpDists[0];
    entity.jumpDists[1] =
      Math.floor(Math.random() * 3) > 2
        ? randRange(M_MIN, M_MAX)
        : entity.jumpDists[1];
    entity.jumpDists[2] =
      Math.floor(Math.random() * 3) > 2
        ? randRange(F_MIN, F_MAX)
        : entity.jumpDists[2];

    return entity;
  }
  protected crossover(mother: Entity, father: Entity): [Entity, Entity] {
    console.log("CROSSOVER");
    let son = mother;
    let daughter = father;

    son.runner.distanceRan = 0;
    daughter.runner.distanceRan = 0;

    son.jumpDists[0] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[0]
      : father.jumpDists[0];
    son.jumpDists[1] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[1]
      : father.jumpDists[1];
    son.jumpDists[2] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[2]
      : father.jumpDists[2];

    daughter.jumpDists[0] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[0]
      : father.jumpDists[0];
    daughter.jumpDists[1] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[1]
      : father.jumpDists[1];
    daughter.jumpDists[2] = Math.floor(Math.random() * 2)
      ? mother.jumpDists[2]
      : father.jumpDists[2];

    return [son, daughter];
  }
  protected async fitness(entity: Entity): Promise<number> {
    const wRunner: IRunner = window.Runner;
    var runner = wRunner.instance_;
    runner.startGame();
    runner.playIntro();
    runner.tRex.startJump(runner.currentSpeed);

    let Run = async () => {
      return await new Promise(async (res) => {
        console.log(`Starting Fitness for ${entity.jumpDists[0]}`);

        const interval = setInterval(() => {
          if (!runner.playing) {
            res("");
            clearInterval(interval);
          } else if (!runner.tRex.jumping) {
            var inputs = getObstacles(runner);

            var shouldJump = ShouldJump(entity.jumpDists, inputs);
            if (shouldJump) {
              runner.tRex.startJump(runner.currentSpeed);
            }
          }
        }, 50);
      });
    };

    await Run();

    entity.runner = { ...runner };

    runner.restart();

    console.log(
      `Distance Ran: ${
        Math.ceil(entity.runner.distanceRan) * DIST_COEFFICIENT
      } with stats ${new Array(
        entity.jumpDists[0],
        entity.jumpDists[1],
        entity.jumpDists[2]
      )}`
    );

    return (
      (Math.ceil(entity.runner.distanceRan) * DIST_COEFFICIENT) / HIGH_SCORE
    );
  }
  protected shouldContinue(state: GeneticState<Entity>): boolean {
    return (
      Math.ceil(state.population[0].entity.runner.distanceRan) *
        DIST_COEFFICIENT <
      HIGH_SCORE
    );
  }

  public optimize = (fitnessA: number, fitnessB: number) => {
    return fitnessA >= fitnessB;
  };

  // more likely allows the most fit individuals to survive between generations
  public select1 = Select1.Tournament2;
  // always mates the most fit individual with random individuals
  public select2 = Select2.Tournament2;

  public async notification({
    population: pop,
    isFinished,
    generation,
    stats,
  }: {
    population: Population<Entity>;
    generation: number;
    stats: Stats;
    isFinished: boolean;
  }) {
    console.log(`Current generation Stats: Gen #${generation}`);
    console.log(stats);
    console.log(pop);

    if (isFinished) {
      console.log(`Finished with pop: ${pop}`);
      // console.log(
      //   `Solution is ${pop[0].entity} (expected ${this.userData.solution})`
      // );
    }
    console.log("==========");
  }
}

const userData: UserData = {
  solution: 10000,
};

const config: Partial<Configuration> = {
  crossover: 0.75,
  iterations: 5,
  mutation: 0.3,
  size: 3,
};

const ShouldJump = (jumpDists: number[], inputs: JumpInputs) => {
  if (inputs.altitude) return false;

  if (inputs.speed > inputs.maxSpeed * 0.9) {
    if (inputs.distance <= jumpDists[2]) {
      return true;
    }
  } else if (inputs.speed > inputs.maxSpeed * 0.75) {
    if (inputs.distance <= jumpDists[1]) {
      return true;
    }
  } else {
    if (inputs.distance <= jumpDists[0]) {
      return true;
    }
  }

  return false;
};

const getObstacles: (runner: IRunner) => JumpInputs = (runner) => {
  const defaultObstacle = {
    xPos: 650, // not on the canvas
    width: 30, // not important
    typeConfig: { height: 40 }, // not important
    yPos: 100, // not important
  };

  let obs = runner.horizon.obstacles.length
    ? runner.horizon.obstacles[0]
    : defaultObstacle;

  if (obs.xPos - 50 <= 0) {
    obs =
      runner.horizon.obstacles.length > 1
        ? runner.horizon.obstacles[1]
        : defaultObstacle;
  }

  return {
    speed: runner.currentSpeed,
    maxSpeed: runner.config.MAX_SPEED,
    distance: obs.xPos - 50,
    width: obs.width,
    height: obs.typeConfig.height,
    altitude:
      150 /* canvas height */ -
        10 /* earth */ -
        obs.yPos /* pos from top */ -
        obs.typeConfig.height /* height of the obstacle */ >
      40
        ? 1
        : 0,
  };
};

const runAI = async () => {
  document.body.classList.add("offline");
  new Runner(".interstitial-wrapper");

  // so we dont get any errors
  await sleep(250);

  const genetic = new CustomGenetic(config, userData);
  genetic.evolve();
};

document.addEventListener("DOMContentLoaded", runAI);
