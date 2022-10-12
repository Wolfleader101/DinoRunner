const shouldJump = () => {
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

        var shouldJump = common.shouldJump(neuralNetwork, inputs);
        if (shouldJump) {
          runner.tRex.startJump(runner.currentSpeed);
        }
      }
    }
  }, 50);
};

document.addEventListener("DOMContentLoaded", runAI);
