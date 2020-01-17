const express = require("express");
const artistsRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

artistsRouter.param("artistId", (req, res, next, artistId) => {
  const sql = "SELECT * FROM Artist WHERE id = $artistId";
  const values = { $artistId: artistId };
  db.get(sql, values, (err, artist) => {
    if (err) {
      next(err);
    } else if (artist) {
      req.artist = artist;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

artistsRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM artist WHERE Artist.is_currently_employed = 1",
    (err, artists) => {
      if (err) {
        next(err);
      }
      res.status(200).json({ artists: artists });
    }
  );
});

artistsRouter.get("/:artistId", (req, res, next) => {
  res.status(200).json({ artist: req.artist });
});

const validateArtistRequest = (req, res, next) => {
  const artist = req.body.artist;
  artist.is_currently_employed = artist.is_currently_employed === 0 ? 0 : 1;

  if (!artist.name || !artist.dateOfBirth || !artist.biography) {
    return res.sendStatus(400);
  } else {
    next();
  }
};

artistsRouter.post("/", validateArtistRequest, (req, res, next) => {
  const sql =
    "INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) " +
    " VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)";

  const value = {
    $name: req.body.artist.name,
    $dateOfBirth: req.body.artist.dateOfBirth,
    $biography: req.body.artist.biography,
    $isCurrentlyEmployed: req.body.artist.is_currently_employed
  };

  db.run(sql, value, function(error) {
    if (error) {
      next(error);
    } else {
      const sql = "SELECT * FROM Artist WHERE id = $artistId";
      const value = { $artistId: this.lastID };
      db.get(sql, value, (err, artist) => {
        if (err) {
          next(err);
        } else {
          res.status(201).json({ artist: artist });
        }
      });
    }
  });
});

artistsRouter.put("/:artistId", validateArtistRequest, (req, res, next) => {
  const newArtist = req.body.artist;
  const artistId = Number(req.params.artistId);
  if (!newArtist.id || newArtist.id !== artistId) {
    newArtist.id = artistId;
  }

  const sql =
    "UPDATE Artist SET " +
    "name = $name, " +
    "date_of_birth = $dateOfBirth, " +
    "biography = $biography, " +
    "is_currently_employed = $isCurrentlyEmployed " +
    "WHERE Artist.id = $artistId";

  const values = {
    $name: req.body.artist.name,
    $dateOfBirth: newArtist.dateOfBirth,
    $biography: newArtist.biography,
    $isCurrentlyEmployed: newArtist.is_currently_employed,
    $artistId: newArtist.id
  };

  db.run(sql, values, error => {
    if (error) {
      next(error);
    } else {
      const sql = "SELECT * FROM Artist WHERE id = $artistId";
      const value = { $artistId: newArtist.id };
      db.get(sql, value, (err, artist) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({ artist: artist });
        }
      });
    }
  });
});

artistsRouter.delete("/:artistId", (req, res, next) => {
  const sql =
    "UPDATE Artist SET is_currently_employed = 0 WHERE id = $artistId";
  const values = { $artistId: req.params.artistId };

  db.run(sql, values, err => {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
        (err, artist) => {
          res.status(200).json({ artist: artist });
        }
      );
    }
  });
});

module.exports = artistsRouter;
