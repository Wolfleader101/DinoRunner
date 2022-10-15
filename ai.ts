import { IRunner } from "./chromium/offline.d";
import {
  Stats,
  Genetic,
  GeneticState,
  Configuration,
  Optimize,
} from "@glavin001/genetic-js";
import {
  Population,
  Select1,
  Select2,
} from "@glavin001/genetic-js/dist/src/Selection";

type Entity = {
  shouldJump: number;
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

const HIGH_SCORE = 10000;
const DIST_COEFFICIENT = 0.025;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class CustomGenetic extends Genetic<Entity, UserData> {
  protected seed(): Promise<Entity> {
    return new Promise<Entity>(async (resolve) => {
      const wRunner: IRunner = window.Runner;
      var runner = wRunner.instance_;

      runner.startGame();
      runner.playIntro();
      runner.tRex.startJump(runner.currentSpeed);

      console.log(runner.config.MAX_SPEED);

      let Run = async () => {
        return await new Promise(res => {


        const interval = setInterval(() => {
        if (!runner.playing) {
          res('');
          clearInterval(interval);
        } else if (!runner.tRex.jumping) {
          var inputs = getObstacles(runner);

          // console.log(Math.ceil(runner.distanceRan) * DIST_COEFFICIENT);

          var shouldJump = ShouldJump(inputs);
          if (shouldJump) {
            runner.tRex.startJump(runner.currentSpeed);
          }
        }
      }, 50);

        }
      };

      await Run();

      console.log("test");

      resolve({
        shouldJump: Math.random(),
        runner: runner,
      });
    });
  }
  protected mutate(entity: Entity): Entity {
    return entity;
  }
  protected crossover(mother: Entity, father: Entity): [Entity, Entity] {
    return [mother, father];
  }
  protected fitness(entity: Entity): number | Promise<number> {
    return (
      (Math.ceil(entity.runner.distanceRan) * DIST_COEFFICIENT) / HIGH_SCORE
    );
  }
  protected shouldContinue(state: GeneticState<Entity>): boolean {
    return true;
  }

  public optimize = (fitnessA: number, fitnessB: number) => {
    return fitnessA >= fitnessB;
  };

  // more likely allows the most fit individuals to survive between generations
  public select1 = Select1.Tournament2;
  // always mates the most fit individual with random individuals
  public select2 = Select2.Tournament2;

  public notification({
    population: pop,
    isFinished,
    stats,
    population,
  }: {
    population: Population<Entity>;
    generation: number;
    stats: Stats;
    isFinished: boolean;
  }) {
    if (isFinished) {
      console.log(pop[0]);
      console.log(
        `Solution is ${pop[0].entity} (expected ${this.userData.solution})`
      );
    }
  }
}

const userData: UserData = {
  solution: 1000,
};

const config: Partial<Configuration> = {
  crossover: 0.75,
  iterations: 2000,
  mutation: 0.3,
  size: 2,
};

const ShouldJump = (inputs: JumpInputs) => {
  if (inputs.altitude) return false;

  if (inputs.speed > inputs.maxSpeed * 0.75) {
    if (inputs.distance <= 100) {
      return true;
    }
  } else if (inputs.speed > inputs.maxSpeed * 0.9) {
    if (inputs.distance <= 125) {
      return true;
    }
  } else {
    if (inputs.distance <= 50) {
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

const runAI = () => {
  //   const wRunner = window.Runner;
  //   var runner = wRunner.instance_;

  //   var init: null | boolean = null;

  //   setInterval(function () {
  //     if (runner && init === null) {
  //       runner.startGame();
  //       runner.playIntro();
  //       init = false;
  //     } else if (init === false && runner.playingIntro === false) {
  //       runner.tRex.startJump(runner.currentSpeed);
  //       init = true;
  //     } else if (init && !runner.playing) {
  //       runner.restart();
  //     } else if (init) {
  //       if (!runner.tRex.jumping) {
  //         var inputs = getObstacles(runner);

  //         var shouldJump = ShouldJump(inputs);
  //         if (shouldJump) {
  //           runner.tRex.startJump(runner.currentSpeed);
  //         }
  //       }
  //     }
  //   }, 50);

  const genetic = new CustomGenetic(config, userData);
  genetic.evolve();
};

document.addEventListener("DOMContentLoaded", runAI);
