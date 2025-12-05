-- Custom SQL migration file, put your code below! --

CREATE INDEX `example_vector_idx` ON `example` (libsql_vector_idx(`vector`));
