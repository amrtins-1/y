package com.instituto.api.service;

import com.instituto.api.exception.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public abstract class AbstractCrudService<T, ID> implements CrudService<T, ID> {

    protected final JpaRepository<T, ID> repository;

    protected AbstractCrudService(JpaRepository<T, ID> repository) {
        this.repository = repository;
    }

    @Override
    public List<T> findAll() {
        return repository.findAll();
    }

    @Override
    public T findById(ID id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Recurso nao encontrado: " + id));
    }

    @Override
    public T create(T entity) {
        return repository.save(entity);
    }

    @Override
    public T update(ID id, T entity) {
        findById(id);
        setId(entity, id);
        return repository.save(entity);
    }

    @Override
    public void delete(ID id) {
        T entity = findById(id);
        repository.delete(entity);
    }

    protected abstract void setId(T entity, ID id);
}
