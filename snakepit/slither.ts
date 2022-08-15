import { snakeConsole as console } from '../src/client';
import { GameMap } from '../src/utils';
import { MessageType } from '../src/messages';
import { GameSettings, Direction, RelativeDirection } from '../src/types';
import type { GameStartingEventMessage, Message, SnakeDeadEventMessage } from '../src/types_messages';

export async function getNextMove(gameMap: GameMap, gameSettings: GameSettings, gameTick: number) {
  return Direction.Down;
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