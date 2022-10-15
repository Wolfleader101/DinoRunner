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

type Entity = number;

type UserData = {
  solution: string;
};

class CustomGenetic extends Genetic<Entity, UserData> {
  optimize: Optimize.OptimizeFun;

  protected seed(): number {
    return Math.random();
  }
  protected mutate(entity: number): number {
    throw new Error("Method not implemented.");
  }
  protected crossover(mother: number, father: number): [number, number] {
    throw new Error("Method not implemented.");
  }
  protected fitness(entity: number): number | Promise<number> {
    throw new Error("Method not implemented.");
  }
  protected shouldContinue(state: GeneticState<number>): boolean {
    throw new Error("Method not implemented.");
  }

  // more likely allows the most fit individuals to survive between generations
  public select1 = Select1.Tournament2;
  // always mates the most fit individual with random individuals
  public select2 = Select2.Tournament2;

  public notification({
    population: pop,
    isFinished,
  }: {
    population: Population<Entity>;
    generation: number;
    stats: Stats;
    isFinished: boolean;
  }) {
    console.log("test");
    if (isFinished) {
      console.log(
        `Solution is ${pop[0].entity} (expected ${this.userData.solution})`
      );
    }
  }
}

const userData: UserData = {
  solution: "thisisthesolution",
};

const config: Partial<Configuration> = {
  crossover: 0.75,
  iterations: 2000,
  mutation: 0.3,
  size: 20,
};

const genetic = new CustomGenetic(config, userData);
genetic.evolve();

const ShouldJump = (inputs) => {
  return true;
};

const getObstacles = (runner) => {
  const defaultObstacle = {
    xPos: 650, // not on the canvas
    width: 30, // not important
    typeConfig: { height: 40 }, // not important
    yPos: 100, // not important
  };

  let o = runner.horizon.obstacles.length
    ? runner.horizon.obstacles[0]
    : defaultObstacle;

  if (o.xPos - 50 <= 0) {
    o =
      runner.horizon.obstacles.length > 1
        ? runner.horizon.obstacles[1]
        : defaultObstacle;
  }

  return {
    speed: runner.currentSpeed,
    distance: o.xPos - 50,
    width: o.width,
    height: o.typeConfig.height,
    altitude:
      150 /* canvas height */ -
        10 /* earth */ -
        o.yPos /* pos from top */ -
        o.typeConfig.height /* height of the obstacle */ >
      40
        ? 1
        : 0,
  };
};

const runAI = () => {
  const wRunner = window.Runner;
  var runner = wRunner.instance_;

  var init = null;

  setInterval(function () {
    if (runner && init === null) {
      runner.startGame();
      runner.playIntro();
      init = false;
    } else if (init === false && runner.playingIntro === false) {
      runner.tRex.startJump(runner.currentSpeed);
      init = true;
    } else if (init && !runner.playing) {
      runner.restart();
    } else if (init) {
      if (!runner.tRex.jumping) {
        var inputs = getObstacles(runner);

        var shouldJump = ShouldJump(inputs);
        if (shouldJump) {
          runner.tRex.startJump(runner.currentSpeed);
        }
      }
    }
  }, 50);
};

document.addEventListener("DOMContentLoaded", runAI);