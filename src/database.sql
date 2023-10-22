CREATE TABLE todos (
    id serial primary key,
    description text not null,
    status text not null default 'pending' check (status in ('pending','completed')),
    creationDate timestamp not null default now()
    dueDate timestamp not null
);








