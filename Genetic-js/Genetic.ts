import { Serialization } from "./Serialization";
import * as Optimize from "./Optimize";
import { asyncLooper } from "./asyncLooper";

import {
  Select1,
  Select2,
  Population,
  SingleSelection,
  PairWiseSelection,
} from "./Selection";

export interface Stats {
  maximum: number;
  minimum: number;
  mean: number;
  stdev: number;
}
export interface Configuration {
  size: number;
  crossover: number;
  mutation: number;
  iterations: number;
  fittestAlwaysSurvives: boolean;
  maxResults: number;
  webWorkers: boolean;
  skip: number;
}
export interface InternalGenState {
  rlr: number;
  seq: number;
}

function clone(obj: any) {
  // tslint:disable-next-line:triple-equals
  if (obj == null || typeof obj != "object") {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

export { Optimize, Serialization, Select1, Select2 };

export abstract class Genetic<Entity, UserData> {
  protected usingWebWorker?: boolean;
  private entities: Entity[] = [];

  public internalGenState: InternalGenState = {
    rlr: 0,
    seq: 0,
  };
  protected readonly configuration: Configuration;
  constructor(
    configuration: Partial<Configuration>,
    public readonly userData: UserData
  ) {
    this.configuration = Object.assign(
      {},
      this.defaultConfiguration,
      configuration
    );
  }

  protected defaultConfiguration: Configuration = {
    crossover: 0.9,
    fittestAlwaysSurvives: true,
    iterations: 100,
    maxResults: 100,
    mutation: 0.2,
    size: 250,
    skip: 0,
    webWorkers: true,
  };

  public abstract optimize: Optimize.OptimizeFun;
  protected abstract seed(): Promise<Entity>;
  protected abstract mutate(entity: Entity): Entity;
  protected abstract crossover(
    mother: Entity,
    father: Entity
  ): [Entity, Entity];
  protected abstract fitness(entity: Entity): number | Promise<number>;
  protected abstract shouldContinue(state: GeneticState<Entity>): boolean;
  protected abstract notification(notification: Notification<Entity>): void;
  protected abstract select1: SingleSelection<Entity>;
  protected abstract select2: PairWiseSelection<Entity>;

  private mutateOrNot = (entity: Entity) => {
    // applies mutation based on mutation probability
    return Math.random() <= this.configuration.mutation && this.mutate
      ? this.mutate(clone(entity))
      : entity;
  };

  // tslint:disable-next-line:max-func-body-length
  public async evolve(): Promise<void> {
    // seed the population
    for (let currSeed = 0; currSeed < this.configuration.size; ++currSeed) {
      this.entities.push(clone(await this.seed()));
    }

    let currIteration = 0;
    while (currIteration < this.configuration.iterations) {
      try {
        // reset for each generation
        this.internalGenState = {
          rlr: 0,
          seq: 0,
        };

        // score and sort
        let pop: { fitness: number; entity: Entity }[] = [];

        for (let ent of this.entities) {
          const fitness = await this.fitness(ent);
          pop.push({ fitness, entity: ent });
        }

        pop.map((unsortedPopulation) => {
          return unsortedPopulation.sort((entityA, entityB) => {
            return this.optimize(entityA.fitness, entityB.fitness) ? -1 : 1;
          });
        });

        // generation notification
        const mean =
          pop.reduce((currMean, popItem) => {
            return currMean + popItem.fitness;
          }, 0) / pop.length;
        const stdev = Math.sqrt(
          pop
            .map((popItem) => {
              return (popItem.fitness - mean) * (popItem.fitness - mean);
            })
            .reduce((currStdev, popItem) => {
              return currStdev + popItem;
            }, 0) / pop.length
        );

        const stats = {
          maximum: pop[0].fitness,
          mean: mean,
          minimum: pop[pop.length - 1].fitness,
          stdev: stdev,
        };

        const shouldContinue = this.shouldContinue
          ? this.shouldContinue({
              generation: currIteration,
              population: pop,
              stats,
            })
          : true;
        const isFinished =
          !shouldContinue ||
          currIteration === this.configuration.iterations - 1;

        const shouldSendNotification: boolean =
          isFinished ||
          this.configuration.skip === 0 ||
          currIteration % this.configuration.skip === 0;
        if (shouldSendNotification) {
          this.sendNotification({
            generation: currIteration,
            isFinished,
            population: pop.slice(0, this.configuration.maxResults),
            stats,
          });
        }

        if (isFinished) {
          break;
        }

        // crossover and mutate
        const newPop: Entity[] = [];

        if (this.configuration.fittestAlwaysSurvives) {
          // lets the best solution fall through
          newPop.push(pop[0].entity);
        }

        while (newPop.length < this.configuration.size) {
          if (
            this.crossover && // if there is a crossover function
            Math.random() <= this.configuration.crossover && // base crossover on specified probability
            newPop.length + 1 < this.configuration.size // keeps us from going 1 over the max population size
          ) {
            const parents = this.select2(pop);
            const children = this.crossover(
              clone(parents[0]),
              clone(parents[1])
            ).map(this.mutateOrNot);
            newPop.push(children[0], children[1]);
          } else {
            newPop.push(this.mutateOrNot(this.select1(pop)));
          }
        }
        this.entities = newPop;
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }
    }

    // return await asyncLooper(
    //   (currIteration) => {
    //     return currIteration < this.configuration.iterations;
    //   },
    //   // tslint:disable-next-line:max-func-body-length
    //   async (currIteration, breakFn) => {
    //     try {
    //       // reset for each generation
    //       this.internalGenState = {
    //         rlr: 0,
    //         seq: 0,
    //       };

    //       // score and sort
    //       let pop: { fitness: number; entity: Entity }[] = [];

    //       for (let ent of this.entities) {
    //         const fitness = await this.fitness(ent);
    //         pop.push({ fitness, entity: ent });
    //       }

    //       pop.map((unsortedPopulation) => {
    //         return unsortedPopulation.sort((entityA, entityB) => {
    //           return this.optimize(entityA.fitness, entityB.fitness) ? -1 : 1;
    //         });
    //       });

    //       // generation notification
    //       const mean =
    //         pop.reduce((currMean, popItem) => {
    //           return currMean + popItem.fitness;
    //         }, 0) / pop.length;
    //       const stdev = Math.sqrt(
    //         pop
    //           .map((popItem) => {
    //             return (popItem.fitness - mean) * (popItem.fitness - mean);
    //           })
    //           .reduce((currStdev, popItem) => {
    //             return currStdev + popItem;
    //           }, 0) / pop.length
    //       );

    //       const stats = {
    //         maximum: pop[0].fitness,
    //         mean: mean,
    //         minimum: pop[pop.length - 1].fitness,
    //         stdev: stdev,
    //       };

    //       const shouldContinue = this.shouldContinue
    //         ? this.shouldContinue({
    //             generation: currIteration,
    //             population: pop,
    //             stats,
    //           })
    //         : true;
    //       const isFinished =
    //         !shouldContinue ||
    //         currIteration === this.configuration.iterations - 1;

    //       const shouldSendNotification: boolean =
    //         this.notification &&
    //         (isFinished ||
    //           this.configuration.skip === 0 ||
    //           currIteration % this.configuration.skip === 0);
    //       if (shouldSendNotification) {
    //         this.sendNotification({
    //           generation: currIteration,
    //           isFinished,
    //           population: pop.slice(0, this.configuration.maxResults),
    //           stats,
    //         });
    //       }

    //       if (isFinished) {
    //         breakFn();
    //         return;
    //       }

    //       // crossover and mutate
    //       const newPop = [];

    //       if (this.configuration.fittestAlwaysSurvives) {
    //         // lets the best solution fall through
    //         newPop.push(pop[0].entity);
    //       }

    //       while (newPop.length < this.configuration.size) {
    //         if (
    //           this.crossover && // if there is a crossover function
    //           Math.random() <= this.configuration.crossover && // base crossover on specified probability
    //           newPop.length + 1 < this.configuration.size // keeps us from going 1 over the max population size
    //         ) {
    //           const parents = this.select2(pop);
    //           const children = this.crossover(
    //             clone(parents[0]),
    //             clone(parents[1])
    //           ).map(this.mutateOrNot);
    //           newPop.push(children[0], children[1]);
    //         } else {
    //           newPop.push(this.mutateOrNot(this.select1(pop)));
    //         }
    //       }
    //       this.entities = newPop;
    //     } catch (error) {
    //       console.error(error);
    //       return Promise.reject(error);
    //     }
    //   }
    // );
  }

  private sendNotification({
    population,
    generation,
    stats,
    isFinished,
  }: Notification<Entity>) {
    const response = {
      generation: generation,
      isFinished: isFinished,
      population: population.map(Serialization.stringify),
      stats: stats,
    };

    // self declared outside of scope
    this.notification({
      generation: response.generation,
      isFinished: response.isFinished,
      population: response.population.map(Serialization.parse),
      stats: response.stats,
    });
  }
}

export interface Notification<Entity> {
  population: Population<Entity>;
  generation: number;
  stats: Stats;
  isFinished: boolean;
}

export interface GeneticState<Entity> {
  population: Population<Entity>;
  generation: number;
  stats: Stats;
}
