import { Repository } from 'typeorm';
import { CrudService } from './crud.service';
import { ResourceNotFoundException } from '../utils/errors';

export abstract class AbstractCrudService<T extends { id?: unknown }, ID> implements CrudService<T, ID> {
  protected constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findById(id: ID): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as never });
    if (!entity) {
      throw new ResourceNotFoundException(`Recurso nao encontrado: ${String(id)}`);
    }
    return entity;
  }

  async create(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: ID, entity: T): Promise<T> {
    await this.findById(id);
    this.setId(entity, id);
    return this.repository.save(entity);
  }

  async delete(id: ID): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }

  protected abstract setId(entity: T, id: ID): void;
}
