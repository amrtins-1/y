package com.instituto.api.repository;

import com.instituto.api.model.VideoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VideoItemRepository extends JpaRepository<VideoItem, UUID> {}
