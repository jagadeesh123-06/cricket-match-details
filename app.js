const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let dataBase = null;

const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is started at http://localhost/3000/");
    });
  } catch (error) {
    console.log(error.message);
  }
};
initializeDbAndServer();

const convertPlayerDbObjectIntoResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDbObjectIntoResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchDbjectIntoResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT
        *
    FROM
        player_details
    `;
  const playersArray = await dataBase.all(playersQuery);
  response.send(
    playersArray.map((each) => convertPlayerDbObjectIntoResponseObject(each))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId}
    `;
  const player = await dataBase.get(playerQuery);
  response.send(convertPlayerDbObjectIntoResponseObject(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE
        player_details
    SET
        player_name = ${playerName}
    WHERE 
        player_id = ${playerId}
    `;
  await dataBase.run(updateQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId}
    `;
  const match = await dataBase.get(matchQuery);
  response.send(convertMatchDbObjectIntoResponseObject(match));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatcheQuery = `
    SELECT
        * 
    FROM player_match_score
        NATURAL JOIN match_details
    WHERE
        player_id = ${playerId}
    `;
  const matchDetails = await dataBase.all(getPlayerMatcheQuery);
  response.send(
    matchDetails.map((each) => convertMatchDbObjectIntoResponseObject(each))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const reqQuery = `
    SELECT
        *
    FROM
        player_match_score NATURAL JOIN player_details
    WHERE
        match_id = ${matchId}
    `;
  const ans = await dataBase.all(reqQuery);
  response.send(
    ans.map((each) => convertPlayerDbObjectIntoResponseObject(each))
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const reqQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE
        player_details.player_id = ${playerId}
    `;
  const details = await dataBase.get(reqQuery);
  response.send(details);
});
module.exports = app;

// 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
