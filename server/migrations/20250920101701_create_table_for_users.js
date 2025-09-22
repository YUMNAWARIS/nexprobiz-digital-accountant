/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await knex.schema.createTable('users', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('username', 64).notNullable();
        table.string('email', 255).notNullable();
        table.string('password', 255).notNullable();
        table.string('status', 16).notNullable(); // active, inactive, deleted, blocked, locked
        table.string('role', 16).notNullable().defaultTo('admin'); // master, admin
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTable('users');
};
