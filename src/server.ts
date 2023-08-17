import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import filePath from "./filePath";

const client = new Client({ database: "todoDb" });

client.connect();

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
dotenv.config();

// use the environment variable PORT, or 4000 as a fallback
const PORT_NUMBER = process.env.PORT ?? 4000;

// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// GET /items
app.get("/items", async (req, res) => {
  const allTodos = await client.query("select * from todos");
  res.status(200).json(allTodos.rows);
});

// GET /items/:id
app.get("/items/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const matchingTodo = await client.query(
    "select * from todos where id = ($1)",
    [id]
  );
  if (id === undefined) {
    res
      .status(404)
      .json({ status: "fail", message: "Could not find todo with that id" });
  } else {
    res.status(200).json(matchingTodo.rows);
  }
});

// POST /items
app.post("/items", async (req, res) => {
  const { description } = req.body;
  const createdTodo = await client.query(
    "insert into todos (description) values ($1) returning *",
    [description]
  );
  res.status(201).json(createdTodo.rows);
});

// PATCH /items/:id
app.patch("/items/:id", async (req, res) => {
  const id = req.params.id;
  const { description, status } = req.body;
  console.log("description: ", description, " status: ", status);
  const result = await client.query(
    "update todos set description = ($1), status = ($2) where id = ($3) returning *",
    [description, status, id]
  );
  if (result.rowCount === 1) {
    res.status(200).json({
      status: "success",
      updatedTodo: result.rows,
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a todo with that id identifier",
      },
    });
  }
});

// DELETE /items/:id
app.delete("/items/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await client.query("delete from todos where id = ($1)", [id]);

  const didRemove = result.rowCount === 1;

  if (didRemove) {
    console.log(`deleted the todo with id: ${id}`);
    res.status(200).json({
      status: "success",
      message: `Deleted signature with id ${id}`,
    });
  } else {
    console.log(`could not delete the todo with id: ${id}`);
    res.status(404).json({
      status: "fail",
      message: "Could not find a signature with that id identifier",
    });
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
