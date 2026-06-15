package com.investedu.platform.repository;

import com.investedu.platform.entity.FileResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileResourceRepository extends JpaRepository<FileResourceEntity, Long> {
}
