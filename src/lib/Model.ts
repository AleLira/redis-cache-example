import Cache from "./Cache";
import Database from "./Database";
import { ValueDict } from "knex";

const db = Database.getConnection();

interface FindOptions {
  where: Record<string, unknown> | string;
  whereParams?: Record<string, unknown>;
  fields?: string[];
  limit?: number;
  offset?: number;
  page?: number;
  perPage?: number;
  orderBy?: string;
}

export default abstract class Model<T extends typeof Model = typeof Model> {
  protected static _tableName: string;
  protected static _dbFields: string[];
  protected static _dbConnection = db;

  protected static _useCache = true;
  protected static _cacheTime = 1800;

  public id: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static get table() {
    return this._tableName;
  }
  static get dbFields() {
    return this._dbFields;
  }

  static get useCache() {
    return this._useCache;
  }
  static get cacheTime() {
    return this._cacheTime;
  }

  static get tableName() {
    return this._tableName;
  }

  protected static get cacheKeyPrefix() {
    const modelName = this["name"].toLowerCase();
    return `${modelName}:`;
  }

  public normalized(): Record<string, unknown> {
    const dbFields = (this.constructor as T).dbFields;

    return dbFields.reduce((data, field) => {
      data[field] = this[field];
      return data;
    }, {});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static build(_data: Record<string, unknown>): Model {
    throw new Error("Missing concrete implementation");
  }

  async save() {
    if (this.id) {
      return await this.update();
    }

    return await this.insert();
  }

  private async insert() {
    const constructor = this.constructor as T;

    const now = new Date();

    this.createdAt = now;
    this.updatedAt = now;

    const normalized = this.normalized();

    const table = constructor.table;

    const [result] = await db.insert(normalized, "id").into(table);

    const id = Number(result);
    this.id = id;

    if (constructor.useCache) {
      const cacheKey = constructor.cacheKeyPrefix + id;
      const cacheTime = constructor.cacheTime;
      Cache.set({
        key: cacheKey,
        data: { ...normalized, id },
        secondsToExpire: cacheTime,
      });
    }

    return result;
  }

  private async update() {
    const constructor = this.constructor as T;

    this.updatedAt = new Date();

    const normalized = this.normalized();

    delete (normalized as any).id;

    const where = { id: this.id };

    await db(constructor.table).where(where).update(normalized);

    if (constructor.useCache) {
      const cacheKey = constructor.cacheKeyPrefix + this.id;
      Cache.del(cacheKey);
    }

    return;
  }

  async delete() {
    const constructor = this.constructor as T;

    const table = constructor.table;

    const where = { id: this.id };

    await db(table).where(where).del();

    const cacheKey = constructor.cacheKeyPrefix + this.id;

    await Cache.del(cacheKey);

    delete this.id;

    return;
  }

  static async findOne({
    where,
    whereParams,
    fields = this.dbFields,
  }: FindOptions) {
    const [result] = await db
      .select(fields)
      .from(this.table)
      .where((builder) => {
        if (typeof where === "string") {
          builder.whereRaw(where, whereParams as ValueDict);
        } else {
          builder.where(where);
        }
      })
      .limit(1);

    return result ? this.build({ ...result }) : null;
  }

  static async findMany({
    where,
    whereParams,
    orderBy,
    limit,
    offset,
    fields = this.dbFields,
  }: FindOptions) {
    const result = await db
      .select(fields)
      .from(this.table)
      .where((builder) => {
        if (typeof where === "string") {
          builder.whereRaw(where, whereParams as ValueDict);
        } else {
          builder.where(where);
        }
      })
      .modify((builder) => {
        if (limit) {
          builder.limit(limit);
        }

        if (offset) {
          builder.offset(offset);
        }

        if (orderBy) {
          if (typeof orderBy === "string") {
            builder.orderByRaw(orderBy);
          } else {
            builder.orderBy(orderBy);
          }
        }
      });

    return result ? result.map((item) => this.build({ ...item })) : [];
  }

  public static async findById(id: number) {
    let cacheKey: string = undefined;

    if (this.useCache) {
      cacheKey = this.cacheKeyPrefix + id;
      const dataFromCache = await Cache.get(cacheKey);

      if (dataFromCache) {
        return this.build(dataFromCache);
      }
    }

    const where = { id };
    const options: FindOptions = { where };

    const data = await this.findOne(options);

    if (data && this.useCache) {
      Cache.set({
        key: cacheKey,
        data: data.normalized(),
        secondsToExpire: this.cacheTime,
      });
    }

    return data;
  }

  static async findAll() {
    const findOptions: FindOptions = {
      where: `1 = 1`,
    };

    return await this.findMany(findOptions);
  }

  static async findPerPage({
    where,
    whereParams,
    orderBy,
    page = 0,
    perPage = 10,
  }: FindOptions) {
    if (perPage > 50) {
      const error: any = new Error("Max results per page: 50");
      error.statusCode = 400;
      throw error;
    }

    const options: FindOptions = {
      where,
      whereParams,
      orderBy,
      offset: perPage * (page - 1),
      limit: perPage,
    };

    const count = await this.countAll(options);

    if (options.offset > count) {
      const error: any = new Error("Invalid page");
      error.statusCode = 400;
      throw error;
    }

    const results = await this.findMany(options);

    return {
      results,
      page,
      perPage,
      recordsOnPage: results.length,
      totalPages: Math.ceil(results.length / perPage),
      totalRecords: count,
    };
  }

  static async countAll({ where, whereParams }: FindOptions) {
    const [result] = await db(this.table)
      .select(db.raw("SUM(1) AS cont"))
      .where((builder) => {
        if (typeof where === "string") {
          builder.whereRaw(where, whereParams as ValueDict);
        } else {
          builder.where(where);
        }
      });

    return (result as any).cont;
  }
}
