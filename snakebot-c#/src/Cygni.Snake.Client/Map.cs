﻿using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Cygni.Snake.Client
{
    public class Map
    {
        public Map(int width, int height, int worldTick, IEnumerable<SnakeInfo> snakeInfos, IEnumerable<MapCoordinate> foodPositions, IEnumerable<MapCoordinate> obstaclePositions)
        {
            Tick = worldTick;
            FoodPositions = foodPositions.ToList();
            ObstaclePositions = obstaclePositions.ToList();
            Players = snakeInfos.ToList();

            Width = width;
            Height = height;
        }

        public int Width { get; }

        public int Height { get; }

        public int Tick { get; }

        public IReadOnlyList<SnakeInfo> Players { get; }

        public SnakeInfo GetSnake(string id)
        {
            return Players.FirstOrDefault(s => s.Id.Equals(id, StringComparison.Ordinal));
        }

        public IReadOnlyList<MapCoordinate> FoodPositions { get; }

        public IReadOnlyList<MapCoordinate> ObstaclePositions { get; }

        public IEnumerable<MapCoordinate> SnakeHeads
        {
            get
            {
                return Players.Where(snake => snake.Positions.Any())
                    .Select(snake => snake.Positions.First());
            }
        }

        public IEnumerable<MapCoordinate> SnakeBodies
        {
            get
            {
                return Players.Where(s => s.Positions.Any())
                    .SelectMany(s => s.Positions.Skip(1));
            }
        }

        public IEnumerable<MapCoordinate> SnakeParts
        {
            get
            {
                return Players.SelectMany(s => s.Positions);
            }
        }

        public DirectionalResult GetResultOfDirection(string playerId, Direction dir)
        {
            var mySnake = GetSnake(playerId);
            if (mySnake == null)
            {
                throw new ArgumentException($"No snake with id: {playerId}");
            }

            var myHead = mySnake.Positions.First();
            var target = myHead.GetDestination(dir);

            if (IsSnake(target) || IsObstace(target) || !target.IsInsideMap(Width, Height))
            {
                return DirectionalResult.Death;
            }

            return IsFood(target) ? DirectionalResult.Points : DirectionalResult.Nothing;
        }

        public bool IsObstace(MapCoordinate coordinate)
        {
            return ObstaclePositions.Contains(coordinate);
        }

        public bool IsSnake(MapCoordinate coordinate)
        {
            return SnakeParts.Contains(coordinate);
        }

        public bool IsFood(MapCoordinate coordinate)
        {
            return FoodPositions.Contains(coordinate);
        }

        public bool AbleToUseDirection(string playerId, Direction dir)
        {
            return GetResultOfDirection(playerId, dir).Equals(DirectionalResult.Death) == false;
        }

        public static Map FromJson(string json)
        {
            return FromJson(JObject.Parse(json));
        }

        public static Map FromJson(JObject json)
        {
            int width = (int)json["width"];
            int height = (int)json["height"];
            int tick = (int)json["worldTick"];

            var snakes = json["snakeInfos"].Select(token =>
            {
                string name = (string) token["name"];
                string id = (string) token["id"];
                int points = (int) token["points"];
                var positions = token["positions"].Select(i => MapCoordinate.FromIndex((int) i, width));
                return new SnakeInfo(id, name, points, positions);
            });

            var foods = json["foodPositions"].Select(i => MapCoordinate.FromIndex((int) i, width));
            var obstacles = json["obstaclePositions"].Select(i => MapCoordinate.FromIndex((int) i, width));
            return new Map(width, height, tick, snakes, foods, obstacles);
        }
    }
}