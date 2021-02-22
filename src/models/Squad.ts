import Model from "../lib/Model";

export default class Squad extends Model {
  protected static readonly _tableName = "squad";

  protected static readonly _dbFields: string[] = [
    "id",
    "name",
    "product",
    "tool",
    "memberCount",
    "createdAt",
    "updatedAt",
  ];

  public name: string;
  public product: string;
  public tool: string;
  public memberCount: number;

  constructor(data: any) {
    super(data);

    const { name, product, tool, memberCount } = data;

    this.name = name;
    this.product = product;
    this.tool = tool;
    this.memberCount = memberCount;
  }

  public static build(data: any): Squad {
    return new this(data);
  }
}
