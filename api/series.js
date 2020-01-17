const express = require("express");
const seriesRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

const issuesRouter = require("./issues");

seriesRouter.use("/:seriesId/issues", issuesRouter);

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
  const sql = "SELECT * FROM Series WHERE id = $seriesId";
  const values = { $seriesId: seriesId };
  db.get(sql, values, (err, series) => {
    if (err) {
      next(err);
    } else if (series) {
      req.series = series;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM series", (err, series) => {
    if (err) {
      next(err);
    }
    res.status(200).json({ series: series });
  });
});

seriesRouter.get("/:seriesId", (req, res, next) => {
  res.status(200).json({ series: req.series });
});

const validateSeriesRequest = (req, res, next) => {
  const series = req.body.series;

  if (!series.name || !series.description) {
    return res.sendStatus(400);
  } else {
    next();
  }
};

seriesRouter.post("/", validateSeriesRequest, (req, res, next) => {
  const sql =
    "INSERT INTO Series (name, description) VALUES ($name, $description)";

  const value = {
    $name: req.body.series.name,
    $description: req.body.series.description
  };

  db.run(sql, value, function(error) {
    if (error) {
      next(error);
    } else {
      const sql = "SELECT * FROM Series WHERE id = $seriesId";
      const value = { $seriesId: this.lastID };
      db.get(sql, value, (err, series) => {
        if (err) {
          next(err);
        } else {
          res.status(201).json({ series: series });
        }
      });
    }
  });
});

seriesRouter.put("/:seriesId", validateSeriesRequest, (req, res, next) => {
  const newSeries = req.body.series;
  const seriesId = Number(req.params.seriesId);
  if (!newSeries.id || newSeries.id !== seriesId) {
    newSeries.id = seriesId;
  }

  const sql =
    "UPDATE Series SET " +
    "name = $name, " +
    "description = $description " +
    "WHERE Series.id = $seriesId";

  const values = {
    $name: req.body.series.name,
    $description: newSeries.description,
    $seriesId: newSeries.id
  };

  db.run(sql, values, error => {
    if (error) {
      next(error);
    } else {
      const sql = "SELECT * FROM Series WHERE id = $seriesId";
      const value = { $seriesId: newSeries.id };
      db.get(sql, value, (err, series) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({ series: series });
        }
      });
    }
  });
});

seriesRouter.delete("/:seriesId", (req, res, next) => {
  const issueSql = "SELECT * FROM Issue WHERE Issue.series_id = $seriesId";
  const issueValues = { $seriesId: req.params.seriesId };
  db.get(issueSql, issueValues, (error, issue) => {
    if (error) {
      next(error);
    } else if (issue) {
      res.sendStatus(400);
    } else {
      const deleteSql = "DELETE FROM Series WHERE Series.id = $seriesId";
      const deleteValues = { $seriesId: req.params.seriesId };

      db.run(deleteSql, deleteValues, error => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = seriesRouter;
