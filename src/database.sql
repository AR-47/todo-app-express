CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (STATUS IN ('pending','completed')),
    creationDate DATE NOT NULL DEFAULT CURRENT_DATE,
    dueDate DATE NOT NULL
);