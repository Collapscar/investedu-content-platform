package com.investedu.platform.repository;

import com.investedu.platform.entity.CategoryEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
  List<CategoryEntity> findAllByOrderByDisplayOrderAscNameAsc();

  Optional<CategoryEntity> findByName(String name);

  boolean existsByName(String name);
}
