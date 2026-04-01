export interface CrudService<T, ID> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T>;
  create(entity: T): Promise<T>;
  update(id: ID, entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}
