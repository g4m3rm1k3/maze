const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events,
  MouseConstraint,
  Mouse,
} = Matter;

const width = parseInt(window.innerWidth - 5);
const height = parseInt(window.innerHeight - 5);
const minDim = Math.min(width, height);
console.log(minDim);
const cellsHorizontal = Math.floor(minDim / 40);
const cellsVertical = Math.floor(minDim / 40);
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;
const borderWidth = 4;
const midY = height / 2;
const midX = width / 2;
const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const wallColor =
  "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
const ballColor =
  "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
const goalColor =
  "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);
World.add(
  world,
  MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas),
  })
);
const walls = [
  Bodies.rectangle(midX, height + borderWidth / 2, width, borderWidth, {
    isStatic: true,
  }),
  Bodies.rectangle(midX, -borderWidth / 2, width, borderWidth, {
    isStatic: true,
  }),
  Bodies.rectangle(-borderWidth / 2, midY, borderWidth, height, {
    isStatic: true,
  }),
  Bodies.rectangle(width + borderWidth / 2, midY, borderWidth, height, {
    isStatic: true,
  }),
];
World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsHorizontal - 1)
  .fill(null)
  .map(() => Array(cellsVertical).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  // If I have visited the cell at [row, column] return
  if (grid[row][column]) {
    return;
  }
  //Mark this cell as being visited
  grid[row][column] = true;
  // Assemble randomly ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  // for each neighbor
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    // if neighbor is out of bounds or has been visited
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }
    // if we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    // remove wall from either horizontals or verticals array
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }
    // Visit that next cell
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, idx) => {
  row.forEach((open, column) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      column * unitLengthX + unitLengthX / 2,
      idx * unitLengthY + unitLengthY,
      unitLengthX,
      borderWidth,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: wallColor,
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, idx) => {
  row.forEach((open, column) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      column * unitLengthX + unitLengthX,
      idx * unitLengthY + unitLengthY / 2,
      borderWidth,
      unitLengthY,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: wallColor,
        },
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX - 5,
  unitLengthY - 5,
  {
    isStatic: true,
    label: "goal",
    render: {
      fillStyle: goalColor,
    },
  }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 3;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius * 0.9, {
  isStatic: false,
  label: "ball",
  render: {
    fillStyle: ballColor,
  },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  if (event.key.toLowerCase() === "w") {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  if (event.key.toLowerCase() === "d") {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  if (event.key.toLowerCase() === "s") {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.key.toLowerCase() === "a") {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win Condition

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
      const win = document.querySelector(".winner");
      win.classList.remove("hidden");
      win.addEventListener("click", () => {
        location.reload();
      });
    }
  });
});

stepThroughCell(startRow, startColumn);
