import * as Bluebird from "bluebird";
import IORedis, {
  Cluster,
  ClusterNode,
  Redis,
  ClusterOptions,
  RedisOptions,
} from "ioredis";

interface CacheSetterParams {
  key: string;
  data: any;
  secondsToExpire?: number;
}

interface CacheOptions extends RedisOptions {
  nodes?: ClusterNode[];
  options?: ClusterOptions;
}

interface CacheCredentials {
  host: string;
  port: number;
  keyPrefix?: string;
  password?: string;
  isCluster: boolean;
  requestTimeout?: number;
}

export default class Cache {
  private static _redisInstance: Redis | Cluster;
  private static _isCluster = false;
  private static _requestTimeout = 300;

  static get redisInstance(): Redis | Cluster {
    return this._redisInstance;
  }

  static set redisInstance(newInstance: Redis | Cluster) {
    this._redisInstance = newInstance;
  }

  static get isCluster(): boolean {
    return this._isCluster;
  }

  static set isCluster(newValue: boolean) {
    this._isCluster = newValue;
  }

  static get requestTimeout(): number {
    return this._requestTimeout;
  }

  static set requestTimeout(newValue: number) {
    this._requestTimeout = newValue;
  }

  static getCredentials(): CacheCredentials {
    const credentials: CacheCredentials = {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      keyPrefix: process.env.REDIS_PREFIX,
      password: process.env.REDIS_PASSWORD,
      isCluster: process.env.REDIS_CLUSTER ? true : false,
      requestTimeout: Number(process.env.REDIS_REQUEST_TIMEOUT),
    };

    return credentials;
  }

  static getConfig(): CacheOptions {
    const credentials = this.getCredentials();

    const { isCluster, requestTimeout } = credentials;

    this.isCluster = isCluster;
    this.requestTimeout = requestTimeout;

    delete credentials.isCluster;
    delete credentials.requestTimeout;

    const redisOptions: CacheOptions = {
      ...credentials,
      retryStrategy: () => null,
      reconnectOnError: () => false,
      connectTimeout: 200,
      keepAlive: 1000,
    };

    if (!this.isCluster) {
      return redisOptions;
    }

    delete redisOptions.host;
    delete redisOptions.port;

    const clusterOptions: ClusterOptions = {
      clusterRetryStrategy: () => null,
      scaleReads: "slave",
      redisOptions: redisOptions,
    };

    const finalOptions: CacheOptions = {
      nodes: [{ host: credentials.host, port: credentials.port }],
      options: clusterOptions,
    };

    return finalOptions;
  }

  static getInstance(): Redis | Cluster {
    try {
      if (!this.redisInstance) {
        const config = this.getConfig();

        // @ts-ignore
        IORedis.Promise = Bluebird;

        if (this.isCluster) {
          this.redisInstance = new Cluster(config.nodes, config.options);
        } else {
          this.redisInstance = new IORedis(config as RedisOptions);
        }
      }

      return this.redisInstance;
    } catch (ex) {
      return null;
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const redisInstance = this.getInstance();

      if (!redisInstance || redisInstance.status !== "ready") {
        return null;
      }

      const redisPromise = (redisInstance.get(key) as Bluebird<string>).timeout(
        this.requestTimeout,
        "ERR_TIMEOUT_GET"
      );

      const data = await redisPromise;

      const decodedData: any = JSON.parse(data);

      return decodedData;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async set({
    key,
    data,
    secondsToExpire = 7200,
  }: CacheSetterParams): Promise<"OK"> {
    try {
      const redisInstance = this.getInstance();

      if (!redisInstance || redisInstance.status !== "ready") {
        return null;
      }

      const encodedData: string = JSON.stringify(data);

      const redisPromise = (redisInstance.set(
        key,
        encodedData,
        "EX",
        secondsToExpire
      ) as Bluebird<"OK">).timeout(this.requestTimeout, "ERR_TIMEOUT_SET");

      return redisPromise;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async del(key: string): Promise<number> {
    try {
      const redisInstance = this.getInstance();

      if (!redisInstance || redisInstance.status !== "ready") {
        return null;
      }

      const redisPromise = (redisInstance.del(key) as Bluebird<number>).timeout(
        this.requestTimeout,
        "ERR_TIMEOUT_DEL"
      );

      return redisPromise;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private static handleError(error) {
    if (error != "ERR_TIMEOUT") {
      this.redisInstance = null;
    }
    return null;
  }
}
