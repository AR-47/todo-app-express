CREATE TABLE todos (
    id serial primary key,
    description text not null,
    status text default 'pending',
    creationDate timestamp not null default now()
    dueDate timestamp not null
);








