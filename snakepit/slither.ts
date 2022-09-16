import { Coordinate, GameMap, Snake } from '../src/utils';
import { MessageType } from '../src/messages';
import { GameSettings, Direction, OpositeDirection, TileType } from '../src/types';
import type { GameStartingEventMessage, Message, SnakeDeadEventMessage } from '../src/types_messages';

let nextFoodGoal: Coordinate | undefined;

export async function getNextMove({ playerSnake, ...gameMap }: GameMap, gameSettings: GameSettings, gameTick: number) {

  const move = simulateNextMove({playerSnake,...gameMap} as GameMap, gameSettings, gameTick);
  if(playerSnake.canMoveInDirection(move)) {
    return move;
  }

  return [Direction.Down, Direction.Left,Direction.Right,Direction.Up].find(dir => playerSnake.canMoveInDirection(dir)) ?? Direction.Down;
}

function simulateNextMove({ playerSnake, ...gameMap }: GameMap, gameSettings: GameSettings, gameTick: number) {
  const antiColisionDirection = checkAndAvoidColision({ playerSnake, ...gameMap } as GameMap, playerSnake.direction);
  if (antiColisionDirection != undefined) {
    return antiColisionDirection;
  }

 
  const foodDirection = getFoodDirection({ playerSnake, ...gameMap } as GameMap);
  if (foodDirection != undefined) {
    const antiColisionDirection = checkAndAvoidColision({ playerSnake, ...gameMap } as GameMap, foodDirection);
    if (antiColisionDirection != undefined) {
      return antiColisionDirection;
    }
    return foodDirection;
  } 
  else {
    setNextFoodGoal({ playerSnake, ...gameMap } as GameMap)
  }




  return playerSnake.direction;
}

function setNextFoodGoal({ playerSnake, ...gameMap }: GameMap,) {
  // Locate the closest food
  const foodsCoordinates: Coordinate[] = [];
  gameMap.tiles.forEach((type, index) => {

    if (type === TileType.Food) {
      foodsCoordinates.push(Coordinate.fromPosition(index as unknown as number, gameMap.width));
    }
  });
  if(foodsCoordinates?.length < 3) {
    return;
  }
  // Get all distances
  const foodDistances: [number, Coordinate][] = foodsCoordinates.map(item => {
    const distance = item.manhattanDistanceTo(playerSnake.headCoordinate);
    return [distance, item];
  });
  if (foodDistances?.length > 0) {

    const min = foodDistances.reduce((a, b) => {
      return a[0] < b[0] ? a: b;

    }, [1500, undefined] as unknown as [number, Coordinate])
    
    if(min !== undefined && min[1] != undefined) {
      nextFoodGoal = min[1];
    }
    // nextFoodGoal = foodDistances[Math.floor(Math.random() * foodDistances.length)][1];
  }
}

function getFoodDirection({ playerSnake, ...gameMap }: GameMap) {
  // Check if food still exists
  
  // Check if the snake is at the food goal
  if (nextFoodGoal != undefined) {
    const foodGoalPosition = nextFoodGoal.toPosition(gameMap.width, gameMap.height);

    // Check if tiles still exist
    
    gameMap.tiles.forEach((type,position) => {
      if (type !== TileType.Food && position === foodGoalPosition) {
        nextFoodGoal = undefined;
        return;
      }
    })
    if(nextFoodGoal === undefined) {
      return;
    }
    
    const deltaTo = playerSnake.headCoordinate.deltaTo(nextFoodGoal);

    // if the snake head is already at the food
    if (nextFoodGoal.x === playerSnake.headCoordinate.x && nextFoodGoal.y === playerSnake.headCoordinate.y) {
      nextFoodGoal = undefined;
    } else if (deltaTo.x > 0) {
      return Direction.Right;
    }
    else if (deltaTo.x < 0) {
      return Direction.Left;
    }
    else if (deltaTo.y > 0) {
      return Direction.Down;
    }
    else if (deltaTo.y < 0) {
      return Direction.Up;
    }
    // Add wiggle to make snake longer
  }
}

function checkAndAvoidColision({ playerSnake, ...gameMap }: GameMap, direction: Direction): Direction | undefined {
  // Check if the snake is about to run into the head of another snake
  const avoidedHeadColisionDirection = avoidHeadColision({ playerSnake, ...gameMap } as GameMap, direction);
  if (avoidedHeadColisionDirection !== undefined) {
    return avoidedHeadColisionDirection
  }


  // Checks if the snake will touch the edge in its next turn
  if (!playerSnake.canMoveInDirection(direction)) {

    const _direction = turnBot({ playerSnake, ...gameMap } as GameMap);
    // Check if the snake is about to run into the head of another snake with its new direction.
    const avoidedHeadColisionDirection = avoidHeadColision({ playerSnake, ...gameMap } as GameMap, _direction);
    if (avoidedHeadColisionDirection !== undefined) {
      // Here we tried turning into another snake and ther opposite needs to happen
      return OpositeDirection[_direction]
    }

    return _direction;
  }
}

function avoidHeadColision({ playerSnake, ...gameMap }: GameMap, direction: Direction) {
  // Check if new direction +1 is a enemy snake head if true turn in a different direction
  for (const snake of Object.values(gameMap.snakes) as Snake[]) {
    const nextHeadCoordinate = snake.headCoordinate.translateByDirection(snake.direction);
    const playerNextSnakeHead = playerSnake.headCoordinate.translateByDirection(direction);

    // If The heads are about to collide then move
    if (playerNextSnakeHead?.x === nextHeadCoordinate.x && playerNextSnakeHead.y === nextHeadCoordinate.y) {

      return turnBot({ playerSnake, ...gameMap } as GameMap);
    }
  }
}

/**
 * This function run when the snake has recognized an obstacle 
 */
function turnBot({ playerSnake, ...gameMap }: GameMap) {
  // Check which direction the snake is heading
  switch (playerSnake.direction) {

    // If Vertical, turn horizontally
    case Direction.Down:
    case Direction.Up: {
      // Turn left or right

      return !playerSnake.canMoveInDirection(Direction.Right) ? Direction.Left : Direction.Right;
    } default: {
      // If Horizontal, turn Vertically 
      return !playerSnake.canMoveInDirection(Direction.Down) ? Direction.Up : Direction.Down;
    }
  }
}

// This handler is optional
export function onMessage(message: Message) {
  switch (message.type) {
    case MessageType.GameStarting:
      message = message as GameStartingEventMessage; // Cast to correct type
      // Reset snake state here
      break;
    case MessageType.SnakeDead:
      message = message as SnakeDeadEventMessage; // Cast to correct type
      // Check how many snakes are left and switch strategy
      break;
  }
}

// Settings ommitted are set to default values from the server, change this if you want to override them
export const trainingGameSettings = {
  // maxNoofPlayers: 2,
  // obstaclesEnabled: false,
  // ...
} as GameSettings;
