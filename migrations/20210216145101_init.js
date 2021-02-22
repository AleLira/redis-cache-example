exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('squad', function (table){
    table.increments();
    table.string('name');
    table.string('product');
    table.string('tool');
    table.integer('memberCount');
    table.timestamp('createdAt');
    table.timestamp('updatedAt');
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('squad');
};
