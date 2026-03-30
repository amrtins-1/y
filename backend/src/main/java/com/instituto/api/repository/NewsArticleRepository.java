package com.instituto.api.repository;

import com.instituto.api.model.NewsArticle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NewsArticleRepository extends JpaRepository<NewsArticle, UUID> {}
