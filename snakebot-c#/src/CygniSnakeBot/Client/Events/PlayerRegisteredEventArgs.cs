﻿using CygniSnakeBot.Client.Communication.Messages;

namespace CygniSnakeBot.Client.Events
{
    public class PlayerRegisteredEventArgs : GameEvent
    {
        public string Name { get; }

        public string Color { get; }

        public GameSettings GameSettings { get; }

        public string GameMode { get; }

        public override string Type => MessageType.PlayerRegistered;

        public PlayerRegisteredEventArgs(string name, string color, GameSettings gameSettings, string gameMode, string gameId, string receivingPlayerId) 
            : base(gameId, receivingPlayerId)
        {
            Name = name;
            Color = color;
            GameSettings = gameSettings;
            GameMode = gameMode;
        }
    }
}