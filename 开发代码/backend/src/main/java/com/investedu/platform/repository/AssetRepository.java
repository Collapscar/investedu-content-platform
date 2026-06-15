package com.investedu.platform.repository;

import com.investedu.platform.entity.AssetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<AssetEntity, String> {
}
