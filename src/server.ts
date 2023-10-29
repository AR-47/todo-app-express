import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import filePath from "./filePath";
import morgan from "morgan";

// read in contents of any environment variables in the .env file
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());
app.use(morgan("tiny"));

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
    res.status(404).json({
      status: "Error",
      message: "Could not find todo with that id",
    });
  } else {
    res.status(200).json(matchingTodo.rows);
  }
});

// POST /items
app.post("/items", async (req, res) => {
  const { description, dueDate } = req.body;
  const createdTodo = await client.query(
    `insert into todos (description, "dueDate") values ($1, $2) returning *`,
    [description, dueDate]
  );
  res.status(201).json(createdTodo.rows);
});

// PATCH /items/:id
app.patch("/items/:id", async (req, res) => {
  const id = req.params.id;
  const { description, status, dueDate } = req.body;

  const updateTextArray = [];
  const updateValuesArray = [];

  if (description) {
    updateTextArray.push(`description = ($${updateTextArray.length + 1})`);
    updateValuesArray.push(description);
  }
  if (status) {
    updateTextArray.push(`status = ($${updateTextArray.length + 1})`);
    updateValuesArray.push(status);
  }
  if (dueDate) {
    updateTextArray.push(`"dueDate" = ($${updateTextArray.length + 1})`);
    updateValuesArray.push(dueDate);
  }

  updateValuesArray.push(id);

  const updateQueryText = `UPDATE todos SET ${updateTextArray.join(
    ", "
  )} WHERE id = ($${updateValuesArray.length}) returning *`;

  const updatedTodo = await client.query(updateQueryText, updateValuesArray);

  updatedTodo.rowCount === 1
    ? res.status(200).json(updatedTodo.rows)
    : res.status(404).json({
        status: "Error",
        id: "Could not find a todo with that id",
      });
});

// DELETE /items/:id
app.delete("/items/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await client.query("delete from todos where id = ($1)", [id]);

  const didRemove = result.rowCount === 1;

  if (didRemove) {
    res.status(200).json({
      status: "Success",
      message: `Deleted todo with id ${id}`,
    });
  } else {
    res.status(404).json({
      status: "Error",
      message: "Could not find a todo with that id identifier",
    });
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
