package com.investedu.platform.repository;

import com.investedu.platform.entity.TopicEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<TopicEntity, String> {
}
