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
  N_MAX = 150;
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
    console.log(`Entity: ${entity.jumpDists} is mutating`);
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

    console.log(`new JumpDists = ${entity.jumpDists}`);
    return entity;
  }
  protected crossover(mother: Entity, father: Entity): [Entity, Entity] {
    console.log("CROSSOVER");
    console.log(mother);
    console.log(father);
    let son = { ...father };
    let daughter = { ...mother };

    son.runner.distanceRan = 0;
    daughter.runner.distanceRan = 0;

    let A = randRange(0, 2);
    let B = randRange(0, 2);

    if (A == B) {
      if (A == 0) A++;
      else A--;
    }

    if (A > B) {
      let tmp = B;
      B = A;
      A = tmp;
    }

    for (let i = 0; i < 3; ++i) {
      if (i < A || i > B) son.jumpDists[i] = father.jumpDists[i];
      else son.jumpDists[i] = mother.jumpDists[i];
    }

    for (let i = 0; i < 3; ++i) {
      if (i < A || i > B) daughter.jumpDists[i] = mother.jumpDists[i];
      else daughter.jumpDists[i] = father.jumpDists[i];
    }

    console.log("*********************");
    console.log("Cross over:");

    console.log(`Father Stats: ${father.jumpDists}`);
    console.log(`Mother Stats: ${mother.jumpDists}`);
    console.log("=====");
    console.log(`Son Stats: ${son.jumpDists}`);
    console.log(`Daughter Stats: ${daughter.jumpDists}`);
    console.log("*********************");

    return [son, daughter];
  }
  protected async fitness(entity: Entity): Promise<number> {
    const wRunner: IRunner = window.Runner;
    var runner = wRunner.instance_;

    console.log(`Starting Fitness for ${entity.jumpDists}`);
    runner.startGame();
    runner.playIntro();

    while (true) {
      if (!runner.playing) {
        break;
      } else if (!runner.tRex.jumping) {
        var inputs = getObstacles(runner);

        const shouldJump = ShouldJump(entity.jumpDists, inputs);
        if (shouldJump) {
          runner.tRex.startJump(runner.currentSpeed);
        }
      }

      await sleep(50);
    }

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
  public select2 = Select2.RandomLinearRank;

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
      console.log(`Finished with pop: ${pop.forEach((el) => console.log(el))}`);
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
  iterations: 1000,
  mutation: 0.5,
  size: 4,
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
  await genetic.evolve();
};

document.addEventListener("DOMContentLoaded", runAI);
